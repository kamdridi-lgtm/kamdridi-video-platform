require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Replicate = require('replicate');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Database simulé (en production, utilise MongoDB/PostgreSQL)
const orders = new Map();
const videos = new Map();

// Replicate client pour génération vidéo AI
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ==========================================
// ENDPOINTS STRIPE
// ==========================================

// Créer Checkout Session
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { packageType, email, customerName } = req.body;

    const packages = {
      teaser: { price: 30000, name: 'Teaser Pack', credits: 1 },
      video: { price: 150000, name: 'Music Video Pack', credits: 5 },
      album: { price: 500000, name: 'Visual Album Pack', credits: 20 },
    };

    const pkg = packages[packageType];
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package type' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `KAMDRIDI AI VISUALS - ${pkg.name}`,
              description: `${pkg.credits} video generation credits`,
              images: ['https://kamdridi.com/logo.png'],
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: email,
      metadata: {
        packageType,
        credits: pkg.credits,
        customerName,
      },
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Create order
    const orderId = uuidv4();
    const order = {
      id: orderId,
      email: session.customer_email,
      customerName: session.metadata.customerName,
      packageType: session.metadata.packageType,
      credits: parseInt(session.metadata.credits),
      creditsUsed: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    orders.set(orderId, order);

    // Send welcome email
    await sendWelcomeEmail(order);

    console.log('✅ Order created:', orderId);
  }

  res.json({ received: true });
});

// ==========================================
// VIDEO GENERATION ENDPOINTS
// ==========================================

// Generate video
app.post('/api/generate-video', async (req, res) => {
  try {
    const { orderId, prompt, style } = req.body;

    const order = orders.get(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.creditsUsed >= order.credits) {
      return res.status(403).json({ error: 'No credits remaining' });
    }

    // Create video job
    const videoId = uuidv4();
    const video = {
      id: videoId,
      orderId,
      prompt,
      style,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };

    videos.set(videoId, video);

    // Start generation (async)
    generateVideoAsync(videoId, prompt, style);

    // Update credits
    order.creditsUsed++;
    orders.set(orderId, order);

    res.json({
      videoId,
      status: 'processing',
      message: 'Video generation started',
      creditsRemaining: order.credits - order.creditsUsed,
    });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check video status
app.get('/api/video-status/:videoId', async (req, res) => {
  const video = videos.get(req.params.videoId);
  
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json(video);
});

// Get order details
app.get('/api/order/:orderId', async (req, res) => {
  const order = orders.get(req.params.orderId);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Get videos for this order
  const orderVideos = Array.from(videos.values()).filter(
    v => v.orderId === req.params.orderId
  );

  res.json({
    ...order,
    videos: orderVideos,
  });
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function generateVideoAsync(videoId, prompt, style) {
  try {
    const video = videos.get(videoId);
    
    // Enhanced prompt with KAMDRIDI style
    const fullPrompt = `${prompt}, cinematic, ${style}, heavy metal aesthetic, dark moody atmosphere, film grain, professional quality`;

    console.log(`🎬 Generating video ${videoId}...`);

    // Call Replicate API (AnimateDiff ou Stable Video Diffusion)
    const output = await replicate.run(
      "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
      {
        input: {
          cond_aug: 0.02,
          decoding_t: 7,
          input_image: await generateKeyFrame(fullPrompt), // Generate key frame first
          video_length: "14_frames_with_svd",
          sizing_strategy: "maintain_aspect_ratio",
          motion_bucket_id: 127,
          frames_per_second: 6,
        }
      }
    );

    video.status = 'completed';
    video.url = output;
    video.completedAt = new Date().toISOString();
    videos.set(videoId, video);

    // Send completion email
    const order = orders.get(video.orderId);
    await sendCompletionEmail(order, video);

    console.log(`✅ Video ${videoId} completed`);
  } catch (error) {
    console.error(`❌ Video ${videoId} failed:`, error);
    
    const video = videos.get(videoId);
    video.status = 'failed';
    video.error = error.message;
    videos.set(videoId, video);
  }
}

async function generateKeyFrame(prompt) {
  // Generate a single image first for image-to-video
  const output = await replicate.run(
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    {
      input: {
        prompt,
        negative_prompt: "cartoon, anime, low quality, blur, watermark",
      }
    }
  );
  
  return output[0];
}

async function sendWelcomeEmail(order) {
  const accessUrl = `${process.env.FRONTEND_URL}/dashboard?order=${order.id}`;

  const mailOptions = {
    from: '"KAMDRIDI AI Visuals" <visuals@kamdridi.com>',
    to: order.email,
    subject: '🔥 Welcome to KAMDRIDI AI Visuals',
    html: `
      <div style="background: #0a0a0a; color: #fff; padding: 40px; font-family: Arial;">
        <h1 style="color: #d4af37; font-size: 48px; text-align: center;">⚡ KAMDRIDI</h1>
        <h2 style="color: #ff4444;">AI VISUALS</h2>
        
        <p>Yo ${order.customerName || 'there'} ! 🤘</p>
        
        <p>Welcome to KAMDRIDI AI Visuals !</p>
        
        <p><strong>Your Package:</strong> ${order.packageType.toUpperCase()}</p>
        <p><strong>Generation Credits:</strong> ${order.credits}</p>
        
        <div style="margin: 40px 0;">
          <a href="${accessUrl}" 
             style="background: #d4af37; color: #000; padding: 20px 40px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">
            ACCESS YOUR DASHBOARD
          </a>
        </div>
        
        <p>Ready to create some heavy visuals? 🎬💀</p>
        
        <p style="margin-top: 40px; color: #666;">
          Questions? Reply to this email.<br>
          Heavy. Cinematic. Unearthed.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

async function sendCompletionEmail(order, video) {
  const videoUrl = `${process.env.FRONTEND_URL}/video/${video.id}`;

  const mailOptions = {
    from: '"KAMDRIDI AI Visuals" <visuals@kamdridi.com>',
    to: order.email,
    subject: '✅ Your video is ready!',
    html: `
      <div style="background: #0a0a0a; color: #fff; padding: 40px; font-family: Arial;">
        <h1 style="color: #d4af37;">⚡ VIDEO READY</h1>
        
        <p>Yo ${order.customerName || 'there'} !</p>
        
        <p>Your video is ready to download 🔥</p>
        
        <div style="margin: 40px 0;">
          <a href="${videoUrl}" 
             style="background: #d4af37; color: #000; padding: 20px 40px; text-decoration: none; font-weight: bold; border-radius: 10px; display: inline-block;">
            DOWNLOAD VIDEO
          </a>
        </div>
        
        <p><strong>Credits remaining:</strong> ${order.credits - order.creditsUsed}</p>
        
        <p>Ready to generate another one? 🎬</p>
        
        <p style="margin-top: 40px; color: #666;">
          Heavy. Cinematic. Unearthed. 💀
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`🚀 KAMDRIDI Video Platform running on port ${PORT}`);
  console.log(`📧 Frontend URL: ${process.env.FRONTEND_URL}`);
});
