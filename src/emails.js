const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SG_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ismailmtoukhy@gmail.com',
        subject: 'Thanks for joining!',
        text: `Welcome ${name}, we wish you good experience in managing your tasks.`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ismailmtoukhy@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye ${name}, we hope to see you back soon.`
    })
}

module.exports = {sendWelcomeEmail, sendGoodbyeEmail}