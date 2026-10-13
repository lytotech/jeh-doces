export const getPublicOrderErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';

  if (message.includes('429')) {
    return 'Muitas tentativas de envio. Aguarde alguns minutos e tente novamente.';
  }
  if (message.includes('Não foi possível validar o envio')) {
    return 'A validação de segurança expirou. Aguarde a nova validação e tente novamente.';
  }
  return 'Não foi possível enviar seu pedido. Confira os dados e tente novamente.';
};
