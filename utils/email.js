const nodeMailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    (this.to = user.email), (this.firstName = user.name.split(" ")[0]);
    this.url = url;
    this.from = `Rudy <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    if (process.env.NODE_ENV === "production") {
      return 1;
    }
    return nodeMailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //actually mail
  async send(template, subject) {
    // render html based on pug
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      { firstName: this.firstName, url: this.url, subject }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html),
    };

    await this.createTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send("welcome", "welcome to the family");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      `Your Password reset token only valid for 10 min`
    );
  }
};

// const sendEmail = async (options) => {
//   creating transporter (service which send email)
//   const transporter = nodeMailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // definig the email options
//   const mailOptions = {
//     from: `Admin User <admin@testuser.com>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   // sending mail
//   await transporter.sendMail(mailOptions);
// };
