import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './agents.css';

// ============================================================
// Dynamic Form Component
// ============================================================
const DynamicForm = ({ formConfig, onSubmit, loading }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const renderField = (field) => {
    const { name, label, type, required, options, placeholder } = field;

    switch (type) {
      case 'text':
      case 'number':
        return (
          <input
            type={type}
            id={name}
            value={formData[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            required={required}
            placeholder={placeholder}
          />
        );
      
      case 'select':
        return (
          <select
            id={name}
            value={formData[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            required={required}
          >
            <option value="">Select...</option>
            {options?.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            id={name}
            value={formData[name] || ''}
            onChange={(e) => handleChange(name, e.target.value)}
            required={required}
            placeholder={placeholder}
            rows={4}
          />
        );
      
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={name}
            checked={formData[name] || false}
            onChange={(e) => handleChange(name, e.target.checked)}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      <h2>{formConfig.form_title}</h2>
      {formConfig.fields?.map((field, idx) => (
        <div key={idx} className="form-group">
          <label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="required">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}
      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};

// ============================================================
// Dynamic View Component
// ============================================================
const DynamicView = ({ viewConfig, agentUuid }) => {
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch view data based on data_source
    // This is a placeholder - implement actual data fetching
    setLoading(false);
    setViewData({ message: 'View data will be displayed here' });
  }, [viewConfig, agentUuid]);

  if (loading) return <div className="loading">Loading view...</div>;

  return (
    <div className="dynamic-view">
      <h2>{viewConfig.view_id}</h2>
      <div className="view-content">
        {viewConfig.charts?.map((chart, idx) => (
          <div key={idx} className="chart-placeholder">
            <h3>{chart.metric}</h3>
            <p>Chart Type: {chart.chart_type}</p>
          </div>
        ))}
        {!viewConfig.charts && (
          <pre>{JSON.stringify(viewData, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Workflow Step Component
// ============================================================
const WorkflowStep = ({ workflow, agentUuid, userId, firmId, forms }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setMessage('');
    
    try {
      // Parse steps_json if it's a string
      const steps = typeof workflow.steps_json === 'string' 
        ? JSON.parse(workflow.steps_json) 
        : workflow.steps_json;
      
      let formId = steps?.form_id;
      
      // If form_id doesn't exist or is invalid, try to find form by workflow name
      if (!formId || formId <= 0) {
        // Try to match form by workflow name
        const matchingForm = forms?.find(f => 
          f.form_name.toLowerCase().includes(workflow.workflow_name.toLowerCase()) ||
          workflow.workflow_name.toLowerCase().includes(f.form_name.toLowerCase())
        );
        
        if (matchingForm) {
          formId = matchingForm.id;
        } else if (forms && forms.length > 0) {
          // Use the first available form as fallback
          formId = forms[0].id;
        }
      }
      
      if (!formId) {
        setMessage('Error: No form available for this workflow');
        setLoading(false);
        return;
      }
      
      const response = await axios.post(
        `/api/agents/${agentUuid}/forms/${formId}/submit`,
        {
          user_id: userId,
          firm_id: firmId,
          submission_data: formData
        }
      );
      
      if (response.data.success) {
        setMessage('✅ Submitted successfully!');
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error: ' + response.data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Parse steps_json to get form configuration
  const getFormConfig = () => {
    try {
      const steps = typeof workflow.steps_json === 'string' 
        ? JSON.parse(workflow.steps_json) 
        : workflow.steps_json;
      return steps?.form_config;
    } catch (e) {
      return null;
    }
  };

  const formConfig = getFormConfig();

  return (
    <div className="workflow-step">
      <div className="step-header">
        <h3>{workflow.workflow_name}</h3>
        <p className="step-description">{workflow.description}</p>
      </div>
      
      {message && <div className="message">{message}</div>}
      
      {formConfig && (
        <DynamicForm
          formConfig={formConfig}
          onSubmit={handleFormSubmit}
          loading={loading}
        />
      )}
    </div>
  );
};

// ============================================================
// Main Agent Component
// ============================================================
const AgentComponent = ({ agentUuid, userId = 1, firmId = 1 }) => {
  const [agent, setAgent] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [menus, setMenus] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgentData();
  }, [agentUuid]);

  const fetchAgentData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/agents/${agentUuid}`);
      
      if (response.data.success) {
        setAgent(response.data.data);
        setWorkflows(response.data.data.workflows || []);
        setMenus(response.data.data.menus || []);
      } else {
        setError(response.data.error);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading agent...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!agent) return <div className="error">Agent not found</div>;

  const currentWorkflow = workflows[currentStep];
  
  // Group menus by type
  const headerMenus = menus.filter(m => m.menu_type === 'header');
  const sidebarMenus = menus.filter(m => m.menu_type === 'sidebar');
  const footerMenus = menus.filter(m => m.menu_type === 'footer');
  const floatingMenus = menus.filter(m => m.menu_type === 'floating');
  const dashboardMenus = menus.filter(m => m.menu_type === 'dashboard');
  const chatMenus = menus.filter(m => m.menu_type === 'chat');
  const recommendationMenus = menus.filter(m => m.menu_type === 'recommendation');

  // Render menu items
  const renderMenuItem = (menu, idx, isActive) => (
    <li 
      key={menu.id} 
      className={isActive ? 'active' : ''}
      onClick={() => setCurrentStep(idx)}
      title={menu.tooltip || ''}
    >
      <span className="icon">{menu.icon || '📋'}</span>
      <span className="menu-label">{menu.label}</span>
      {menu.badge && <span className="menu-badge">{menu.badge}</span>}
    </li>
  );

  return (
    <div className="agent-container">
      {/* Header Menus */}
      {headerMenus.length > 0 && (
        <nav className="agent-header-menu">
          <ul>
            {headerMenus.map((menu, idx) => renderMenuItem(menu, idx, currentStep === idx))}
          </ul>
        </nav>
      )}

      <header className="agent-header">
        <h1>{agent.name}</h1>
        <p>{agent.description}</p>
        <span className="agent-type">{agent.agent_type}</span>
      </header>

      {/* Sidebar Menus */}
      <div className="agent-sidebar">
        <h3>Menu</h3>
        <ul>
          {sidebarMenus.length > 0 ? (
            sidebarMenus.map((menu, idx) => renderMenuItem(menu, idx, currentStep === idx))
          ) : (
            workflows.map((workflow, idx) => (
              <li 
                key={workflow.id} 
                className={currentStep === idx ? 'active' : ''}
                onClick={() => setCurrentStep(idx)}
              >
                <span className="icon">📋</span>
                {workflow.workflow_name}
              </li>
            ))
          )}
        </ul>
      </div>

      <main className="agent-content">
        {/* Dashboard Menus */}
        {dashboardMenus.length > 0 && (
          <div className="dashboard-menu">
            <h3>Dashboard</h3>
            <div className="dashboard-grid">
              {dashboardMenus.map((menu, idx) => (
                <div 
                  key={menu.id}
                  className={`dashboard-card ${currentStep === idx ? 'active' : ''}`}
                  onClick={() => setCurrentStep(idx)}
                >
                  <span className="icon">{menu.icon || '📊'}</span>
                  <span className="label">{menu.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Menus */}
        {chatMenus.length > 0 && (
          <div className="chat-menu">
            {chatMenus.map((menu, idx) => (
              <button 
                key={menu.id}
                className={`chat-button ${currentStep === idx ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
              >
                <span className="icon">{menu.icon || '💬'}</span>
                {menu.label}
              </button>
            ))}
          </div>
        )}

        {/* Recommendation Menus */}
        {recommendationMenus.length > 0 && (
          <div className="recommendation-menu">
            <h4>Recommended Actions</h4>
            <div className="recommendation-list">
              {recommendationMenus.map((menu, idx) => (
                <div 
                  key={menu.id}
                  className={`recommendation-item ${currentStep === idx ? 'active' : ''}`}
                  onClick={() => setCurrentStep(idx)}
                >
                  <span className="icon">{menu.icon || '⭐'}</span>
                  <span className="label">{menu.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        {currentWorkflow && (
          <WorkflowStep
            workflow={currentWorkflow}
            agentUuid={agentUuid}
            userId={userId}
            firmId={firmId}
            forms={agent.forms}
          />
        )}
      </main>

      {/* Footer Menus */}
      {footerMenus.length > 0 && (
        <footer className="agent-footer">
          <ul>
            {footerMenus.map((menu, idx) => renderMenuItem(menu, idx, currentStep === idx))}
          </ul>
        </footer>
      )}

      {/* Floating Menus */}
      {floatingMenus.length > 0 && (
        <div className="floating-menu">
          {floatingMenus.map((menu, idx) => (
            <button 
              key={menu.id}
              className={`floating-button ${currentStep === idx ? 'active' : ''}`}
              onClick={() => setCurrentStep(idx)}
              title={menu.label}
            >
              <span className="icon">{menu.icon || '🔘'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Agent List Component
// ============================================================
const AgentList = ({ onSelectAgent, firmId }) => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('Pindex'); // 'Pindex', 'Cindex'

  useEffect(() => {
    fetchAgents();
  }, [firmId]);

  const fetchAgents = async () => {
    try {
      // Don't filter by firmId to show all agents
      const url = '/api/agents';
      console.log('Fetching agents from:', url);
      const response = await axios.get(url);
      console.log('Response:', response.data);
      if (response.data.success) {
        setAgents(response.data.data);
        console.log('Agents loaded:', response.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter agents by category
  const filteredAgents = agents.filter(agent => agent.agent_category === categoryFilter);

  if (loading) return <div className="loading">Loading agents...</div>;

  return (
    <div className="agent-list">
      <h1>Available Agents</h1>
      
      {/* Category Filter Buttons */}
      <div className="category-filter">
        <button 
          className={`filter-btn filter-btn-pindex ${categoryFilter === 'Pindex' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('Pindex')}
        >
          👤 Personal Index ({agents.filter(a => a.agent_category === 'Pindex').length})
        </button>
        <button 
          className={`filter-btn filter-btn-cindex ${categoryFilter === 'Cindex' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('Cindex')}
        >
          🏢 Community Index ({agents.filter(a => a.agent_category === 'Cindex').length})
        </button>
      </div>

      <div className="agent-grid">
        {filteredAgents.map((agent) => (
          <div key={agent.id} className={`agent-card agent-card-${agent.agent_category?.toLowerCase() || 'default'}`}>
            <div className="agent-card-header">
              <h3>{agent.name}</h3>
              <div className="agent-badges">
                {agent.agent_category && (
                  <span className={`agent-category-badge badge-${agent.agent_category.toLowerCase()}`}>
                    {agent.agent_category === 'Pindex' ? '👤 Personal' : '🏢 Community'}
                  </span>
                )}
                <span className="agent-type-badge">{agent.agent_type}</span>
              </div>
            </div>
            <p>{agent.description}</p>
            <button onClick={() => onSelectAgent && onSelectAgent(agent.agent_uuid)}>
              Launch Agent
            </button>
          </div>
        ))}
        {filteredAgents.length === 0 && (
          <div className="no-agents">
            <p>No {categoryFilter} agents found</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Agent Manager Component (Main Entry Point)
// ============================================================
const AgentManager = ({ userId = 1, firmId = 1 }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  return (
    <>
      {!selectedAgent ? (
        <AgentList onSelectAgent={setSelectedAgent} firmId={firmId} />
      ) : (
        <div>
          <button 
            onClick={() => setSelectedAgent(null)}
            style={{
              position: 'fixed',
              top: '1rem',
              right: '1rem',
              zIndex: 1000,
              padding: '0.5rem 1rem',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Back to Agents
          </button>
          <AgentComponent 
            agentUuid={selectedAgent} 
            userId={userId}
            firmId={firmId}
          />
        </div>
      )}
    </>
  );
};

export default AgentManager;
export { AgentComponent, AgentList };
