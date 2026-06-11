const express = require('express');
const app = express();
app.use(express.json());

const SOMENTE_PDF = [
  'acordes', 'apocalipse_revelacoes', 'biblia_facil',
  'descobertas_biblicas', 'ensinos_de_jesus', 'espiritismo_curso',
  'fique_leve', 'grande_conflito', 'incriveis_milagres',
  'principios', 'saldo_mais'
];

app.post('/flow', (req, res) => {
  const { screen, data } = req.body;

  if (screen === 'JOIN_NOW') {
    const curso = data['Curso Solicitado'] || '';
    const somentePDF = SOMENTE_PDF.includes(curso);

    return res.json({
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
    });
  }

  return res.json({ screen, data: {} });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
