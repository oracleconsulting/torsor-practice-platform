import React from 'react';
import { useParams } from 'react-router-dom';
import { CampaignList } from './CampaignList';
import { CampaignForm } from './CampaignForm';

export const CampaignPage = () => {
  const { campaignId } = useParams();

  // If no campaignId is provided, show the list view
  if (!campaignId) {
    return <CampaignList />;
  }

  // If campaignId is 'new', show the create form
  if (campaignId === 'new') {
    return <CampaignForm />;
  }

  // Otherwise, show the edit form for the specific campaign
  return <CampaignForm campaignId={campaignId} />;
}; 