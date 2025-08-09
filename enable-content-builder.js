// Script to enable content type builder feature flag for testing
const features = {
  contentTypeBuilder: true,
  threeColumnLayout: true,
  catalystBranding: true,
  glassMorphism: true,
};

if (typeof window !== 'undefined') {
  const existingFlags = JSON.parse(localStorage.getItem('featureFlags') || '{}');
  const updatedFlags = { ...existingFlags, ...features };
  localStorage.setItem('featureFlags', JSON.stringify(updatedFlags));
  console.log('Content Type Builder feature enabled!');
  console.log('Updated flags:', updatedFlags);
} else {
  console.log('Run this script in the browser console to enable the Content Type Builder feature.');
}