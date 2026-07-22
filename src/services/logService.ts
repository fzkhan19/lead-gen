import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.ts';

export interface CampaignLog {
  id?: string;
  uid: string;
  leadId?: string;
  leadName?: string;
  action: string;
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: any;
}

export async function addCampaignLog(params: {
  leadId?: string;
  leadName?: string;
  action: string;
  status: 'info' | 'success' | 'warning' | 'error';
  message: string;
}) {
  const user = auth.currentUser;
  if (!user) {
    console.warn('[LOG] No user authenticated, skipping campaign log write');
    return;
  }

  try {
    const logsRef = collection(db, 'campaign_logs');
    await addDoc(logsRef, {
      uid: user.uid,
      leadId: params.leadId || '',
      leadName: params.leadName || '',
      action: params.action,
      status: params.status,
      message: params.message,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('[LOG ERROR] Failed to write campaign log:', error);
  }
}
