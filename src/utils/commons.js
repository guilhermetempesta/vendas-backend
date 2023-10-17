const { Sequence } = require("../models/Sequence");

exports.initializeSequence = async () => {
  const sequenceName = 'saleCode';

  try {
    // Verifica se o documento de sequência já existe
    const existingSequence = await Sequence.findOne({ _id: sequenceName });

    if (!existingSequence) {
      // Se não existir, cria um novo documento de sequência com seq inicial como 1
      await Sequence.create({ _id: sequenceName, seq: 0 });
    }
  } catch (error) {
    console.error('Erro ao inicializar a sequência:', error);
  }
};
