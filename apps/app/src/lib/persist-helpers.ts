export const purgeAuthState = async () => {
  const { persistor } = await import('@/store');
  persistor.purge();
};
