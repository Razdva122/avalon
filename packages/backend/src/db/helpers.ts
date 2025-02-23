export const buildMongoURI = () => {
  const user = encodeURIComponent(process.env.MONGODB_USER!);
  const password = encodeURIComponent(process.env.MONGODB_PASSWORD!);
  const host = process.env.MONGODB_HOST!;
  const port = process.env.MONGODB_PORT!;
  const dbName = process.env.DB_NAME!;

  const auth = user && password ? `${user}:${password}@` : '';
  const portPart = port ? `:${port}` : '';

  return `mongodb://${auth}${host}${portPart}/${dbName}`;
};
