import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrixcoreExperience } from './components/BrixcoreExperience';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root was not found.');

createRoot(container).render(
  <StrictMode>
    <BrixcoreExperience />
  </StrictMode>,
);
