import React from 'react';
import { COMPONENT_REGISTRY } from '../../utils/component-registry';

export function TestComponents() {
  const testResults: { name: string; renders: boolean; validatesCorrectly: boolean }[] = [];

  // Test Hero Component
  const HeroComponent = COMPONENT_REGISTRY.hero.component;
  const heroDefaults = COMPONENT_REGISTRY.hero.defaults;
  const heroValidation = COMPONENT_REGISTRY.hero.validate;
  
  testResults.push({
    name: 'Hero',
    renders: !!HeroComponent,
    validatesCorrectly: heroValidation({ title: 'Test' }) === true && heroValidation({}) === false
  });

  // Test Header Component
  const HeaderComponent = COMPONENT_REGISTRY.header.component;
  const headerDefaults = COMPONENT_REGISTRY.header.defaults;
  const headerValidation = COMPONENT_REGISTRY.header.validate;
  
  testResults.push({
    name: 'Header',
    renders: !!HeaderComponent,
    validatesCorrectly: headerValidation({ logo: 'Test' }) === true && headerValidation({}) === false
  });

  // Test Footer Component
  const FooterComponent = COMPONENT_REGISTRY.footer.component;
  const footerDefaults = COMPONENT_REGISTRY.footer.defaults;
  const footerValidation = COMPONENT_REGISTRY.footer.validate;
  
  testResults.push({
    name: 'Footer',
    renders: !!FooterComponent,
    validatesCorrectly: footerValidation({}) === true // Footer has no required fields
  });

  // Test CTA Component
  const CTAComponent = COMPONENT_REGISTRY.cta.component;
  const ctaDefaults = COMPONENT_REGISTRY.cta.defaults;
  const ctaValidation = COMPONENT_REGISTRY.cta.validate;
  
  testResults.push({
    name: 'CTA',
    renders: !!CTAComponent,
    validatesCorrectly: ctaValidation({ primaryButton: { text: 'Test', url: '/' } }) === true && 
                        ctaValidation({ primaryButton: { text: '', url: '/' } }) === false
  });

  return (
    <div style={{ padding: '20px' }}>
      <h1>Component Test Results</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Component</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Renders</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Validation</th>
          </tr>
        </thead>
        <tbody>
          {testResults.map((result) => (
            <tr key={result.name}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{result.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', color: result.renders ? 'green' : 'red' }}>
                {result.renders ? '✓' : '✗'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', color: result.validatesCorrectly ? 'green' : 'red' }}>
                {result.validatesCorrectly ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h2 style={{ marginTop: '40px' }}>Component Rendering with Default Values</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Hero Component</h3>
        <div style={{ border: '1px solid #ddd', padding: '20px' }}>
          <HeroComponent {...heroDefaults} />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Header Component</h3>
        <div style={{ border: '1px solid #ddd', padding: '20px' }}>
          <HeaderComponent {...headerDefaults} />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Footer Component</h3>
        <div style={{ border: '1px solid #ddd', padding: '20px' }}>
          <FooterComponent {...footerDefaults} />
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>CTA Component</h3>
        <div style={{ border: '1px solid #ddd', padding: '20px' }}>
          <CTAComponent {...ctaDefaults} />
        </div>
      </div>
    </div>
  );
}