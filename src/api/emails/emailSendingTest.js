import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendTestEmail = async () => {
    const { data, error } = await resend.emails.send({
        from: 'Matthew <orders@fourways.coffee>',
        to: ['mbaxendale1@proton.me'],
        subject: 'Test Email from Fourways Online Storefront',
        html: '<p>This is a test email sent from the Fourways online storefront to verify email sending functionality.</p>',
    })

    if (error) {
        return console.error({ error })
    }

    console.log('Email sent successfully:', data)
    // res.status(20/0).send('Test email sent successfully.')
}
