import { useEffect } from 'react';
import { PageLayoutProvider, usePageLayout } from '../context/PageLayoutContext';

// Test component to verify context is working
function TestPageLayout() {
  const { sections, setSections, saveLayout } = usePageLayout();

  useEffect(() => {
    console.log('Current sections:', sections);
  }, [sections]);

  const addTestSection = () => {
    const newSection = {
      id: `test-${Date.now()}`,
      type: 'text' as const,
      title: 'Test Section',
      enabled: true,
      order: sections.length,
      settings: {
        title: 'This is a test section',
        content: 'Added via page builder test',
        backgroundColor: '#F3F4F6'
      }
    };
    setSections([...sections, newSection]);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Page Layout Test</h3>
      <p className="mb-4">Current sections: {sections.length}</p>
      <div className="space-y-2 mb-4">
        {sections.map(section => (
          <div key={section.id} className="p-2 bg-gray-100 rounded">
            <span className="font-medium">{section.title}</span>
            <span className="ml-2 text-sm text-gray-600">({section.type})</span>
            <span className={`ml-2 text-sm ${section.enabled ? 'text-green-600' : 'text-red-600'}`}>
              {section.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        ))}
      </div>
      <div className="space-x-2">
        <button
          onClick={addTestSection}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Test Section
        </button>
        <button
          onClick={saveLayout}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Save Layout
        </button>
      </div>
    </div>
  );
}

export function PageLayoutTest() {
  return (
    <PageLayoutProvider>
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6">Page Layout Context Test</h2>
        <TestPageLayout />
      </div>
    </PageLayoutProvider>
  );
}
