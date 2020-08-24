const crypto = require('crypto');
const axios = require('axios');
const { escape } = require('../utils/base64');
const url = require('url');

const FCM_SUBSCRIBE = 'https://fcm.googleapis.com/fcm/connect/subscribe';
const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

module.exports = registerFCM;

async function registerFCM({ senderId, token }) {
  const keys = await createKeys();
  const formData = new URLSearchParams({
    authorized_entity : senderId,
    endpoint          : `${FCM_ENDPOINT}/${token}`,
    encryption_key    : keys.publicKey
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_'),
    encryption_auth : keys.authSecret
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_'),
  });
  const response = await axios({
    url     : FCM_SUBSCRIBE,
    method  : 'POST',
    headers : {
      'Content-Type' : 'application/x-www-form-urlencoded',
    },
    data : formData.toString(),
  });
  return {
    keys,
    fcm : response.data,
  };
}

function createKeys() {
  return new Promise((resolve, reject) => {
    const dh = crypto.createECDH('prime256v1');
    dh.generateKeys();
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        return reject(err);
      }
      return resolve({
        privateKey : escape(dh.getPrivateKey('base64')),
        publicKey  : escape(dh.getPublicKey('base64')),
        authSecret : escape(buf.toString('base64')),
      });
    });
  });
}
