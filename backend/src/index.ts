import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { startSchedulers } from './utils/scheduler';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API docs available at http://localhost:${PORT}/api-docs`);
  startSchedulers();
});
