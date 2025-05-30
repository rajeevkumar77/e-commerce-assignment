const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config("./.env");

admin.initializeApp({
  credential: admin.credential.cert(
    {
        "type": process.env.type,
        "projectid": process.env.projectid,
        "private_keyid": process.env.private_keyid,
        "private_key": process.env.private_key,
        "client_email": process.env.client_email,
        "clientid": process.env.clientid,
        "auth_uri":process.env.auth_uri,
        "token_uri":process.env.token_uri,
        "auth_provider_x509_cert_url":process.env.auth_provider_x509_cert_url,
        "client_x509_cert_url":process.env.client_x509_cert_url,
        "universe_domain": process.env.universe_domain
      }
  ),
  storageBucket: 'claim-sol-26543.appspot.com',
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
