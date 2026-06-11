const express = require('express');
const crypto = require('crypto');
const app = express();
app.use(express.json());

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const APP_SECRET = process.env.APP_SECRET;

const SOMENTE_PDF = [
  'acordes', 'apocalipse_revelacoes', 'biblia_facil',
  'descobertas_biblicas', 'ensinos_de_jesus', 'espiritismo_curso',
  'fique_leve', 'grande_conflito', 'incriveis_milagres',
  'principios', 'saldo_mais'
];

app.post('/flow', (req, res) => {
  try {
    const { encrypted_flow_data, encrypted_aes_key, initial_vector } = req.body;

    const decryptedAesKey = crypto.privateDecrypt(
      { key: PRIVATE_KEY, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
      Buffer.from(encrypted_aes_key, 'base64')
    );

    const iv = Buffer.from(initial_vector, 'base64');
    const encryptedData = Buffer.from(encrypted_flow_data, 'base64');
    const encryptedDataBody = encryptedData.subarray(0, -16);
    const encryptedDataTag = encryptedData.subarray(-16);

    const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, iv);
    decipher.setAuthTag(encryptedDataTag);
    const decryptedBody = JSON.parse(decipher.update(encryptedDataBody) + decipher.final('utf-8'));

    const { screen, data } = decryptedBody;
    let response;

    if (screen === 'JOIN_NOW') {
      const curso = data['Curso Solicitado'] || '';
      const somentePDF = SOMENTE_PDF.includes(curso);
      response = {
        screen: 'CATEGORIES',
        data: {
          'Curso Solicitado': curso,
          'Formato do curso': data['Formato do curso'] || 'pdf',
          formatos: somentePDF
            ? [{ id: 'pdf', title: '📄 PDF — Por e-mail' }]
            : [
                { id: 'pdf', title: '📄 PDF — Por e-mail' },
                { id: 'impresso', title: '📦 Impresso — Correios' }
              ]
        }
      };
    } else {
      response = { screen, data: {} };
    }

    const flippedIv = Buffer.alloc(iv.length);
    for (let i = 0; i < iv.length; i++) flippedIv[i] = ~iv[i];

    const cipher = crypto.createCipheriv('aes-128-gcm', decryptedAesKey, flippedIv);
    const encryptedResponse = Buffer.concat([
      cipher.update(JSON.stringify(response), 'utf-8'),
      cipher.final(),
      cipher.getAuthTag()
    ]);

    res.send(encryptedResponse.toString('base64'));

  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
