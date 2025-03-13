// server/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Créer un transporteur nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Envoyer un email de confirmation
const sendConfirmationEmail = async (email, token) => {
  const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
  
  try {
    await transporter.sendMail({
      from: `"Lord Of The Coin" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Confirmation de votre compte Lord Of The Coin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bienvenue sur Lord Of The Coin!</h2>
          <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous:</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
              Confirmer mon email
            </a>
          </p>
          <p>Si vous n'avez pas créé de compte, veuillez ignorer cet email.</p>
        </div>
      `
    });
    
    console.log(`Email de confirmation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error);
    return false;
  }
};

module.exports = { 
  sendConfirmationEmail 
};