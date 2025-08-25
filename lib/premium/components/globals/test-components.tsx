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
    validatesCorrectly: heroValidation({ title: 'Test' }).isValid === true && heroValidation({}).isValid === false
  });

  // Test Header Component
  const HeaderComponent = COMPONENT_REGISTRY.header.component;
  const headerDefaults = COMPONENT_REGISTRY.header.defaults;
  const headerValidation = COMPONENT_REGISTRY.header.validate;
  
  testResults.push({
    name: 'Header',
    renders: !!HeaderComponent,
    validatesCorrectly: headerValidation({ logo: 'Test' }).isValid === true && headerValidation({}).isValid === false
  });

  // Test Footer Component
  const FooterComponent = COMPONENT_REGISTRY.footer.component;
  const footerDefaults = COMPONENT_REGISTRY.footer.defaults;
  const footerValidation = COMPONENT_REGISTRY.footer.validate;
  
  testResults.push({
    name: 'Footer',
    renders: !!FooterComponent,
    validatesCorrectly: footerValidation({}).isValid === true // Footer has no required fields
  });

  // Test CTA Component
  const CTAComponent = COMPONENT_REGISTRY.cta.component;
  const ctaDefaults = COMPONENT_REGISTRY.cta.defaults;
  const ctaValidation = COMPONENT_REGISTRY.cta.validate;
  
  testResults.push({
    name: 'CTA',
    renders: !!CTAComponent,
    validatesCorrectly: ctaValidation({ primaryButton: { text: 'Test', url: '/' } }).isValid === true && 
                        ctaValidation({ primaryButton: { text: '', url: '/' } }).isValid === false
  });

  return (
    <div className="test-container">
      <h1>Component Test Results</h1>
      <table className="test-results-table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Renders</th>
            <th>Validation</th>
          </tr>
        </thead>
        <tbody>
          {testResults.map((result) => (
            <tr key={result.name}>
              <td>{result.name}</td>
              <td className={result.renders ? 'test-pass' : 'test-fail'}>
                {result.renders ? '✓' : '✗'}
              </td>
              <td className={result.validatesCorrectly ? 'test-pass' : 'test-fail'}>
                {result.validatesCorrectly ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <h2 className="section-title">Component Rendering with Default Values</h2>
      
      <div className="component-preview">
        <h3>Hero Component</h3>
        <div className="component-wrapper">
          <HeroComponent {...heroDefaults} />
        </div>
      </div>

      <div className="component-preview">
        <h3>Header Component</h3>
        <div className="component-wrapper">
          <HeaderComponent {...headerDefaults} />
        </div>
      </div>

      <div className="component-preview">
        <h3>Footer Component</h3>
        <div className="component-wrapper">
          <FooterComponent {...footerDefaults} />
        </div>
      </div>

      <div className="component-preview">
        <h3>CTA Component</h3>
        <div className="component-wrapper">
          <CTAComponent {...ctaDefaults} />
        </div>
      </div>
    </div>
  );
}