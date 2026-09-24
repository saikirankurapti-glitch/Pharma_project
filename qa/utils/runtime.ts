import fs from 'fs';

type Runtime = {
  pharmacistEmail: string;
  managerEmail: string;
  password: string;
  managerPin: string;
  ownerPin: string;
};

export function getRuntime(): Runtime {
  if (process.env.QA_PASSWORD && process.env.QA_PHARMACIST_EMAIL && process.env.QA_MANAGER_EMAIL) {
    return {
      pharmacistEmail: process.env.QA_PHARMACIST_EMAIL,
      managerEmail: process.env.QA_MANAGER_EMAIL,
      password: process.env.QA_PASSWORD,
      managerPin: process.env.QA_MANAGER_PIN || '',
      ownerPin: process.env.QA_OWNER_PIN || ''
    };
  }
  const path = '/tmp/qa-runtime.json';
  if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path, 'utf8')) as Runtime;
  throw new Error('QA runtime credentials are unavailable. Run backend/qa/setup.ts first or provide QA_* environment variables.');
}
