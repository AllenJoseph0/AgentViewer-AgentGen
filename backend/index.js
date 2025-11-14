const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ============================================================
// AGENT ROUTES - Dynamic agent system
// ============================================================

// Get all agents for a firm
app.get('/api/agents', async (req, res) => {
  try {
    const { firm_id, agent_category } = req.query;
    
    let query = 'SELECT id, agent_uuid, name, description, agent_type, agent_category, firm_id, user_id, created_at, updated_at FROM agents';
    const params = [];
    const conditions = [];
    
    if (firm_id) {
      conditions.push('firm_id = ?');
      params.push(firm_id);
    }
    
    if (agent_category) {
      conditions.push('agent_category = ?');
      params.push(agent_category);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY agent_category, name';
    
    const [agents] = await pool.query(query, params);
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent by UUID with full configuration
app.get('/api/agents/:agentUuid', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    
    // Get agent details
    const [agents] = await pool.query(
      'SELECT * FROM agents WHERE agent_uuid = ?',
      [agentUuid]
    );
    
    if (agents.length === 0) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const agent = agents[0];
    
    // Get menus
    const [menus] = await pool.query(
      'SELECT * FROM agent_menus WHERE agent_id = ? ORDER BY menu_type, order_no',
      [agent.id]
    );
    
    // Get workflows
    const [workflows] = await pool.query(
      'SELECT * FROM agent_workflows WHERE agent_id = ?',
      [agent.id]
    );
    
    // Get endpoints
    const [endpoints] = await pool.query(
      'SELECT * FROM agent_endpoints WHERE agent_id = ?',
      [agent.id]
    );
    
    // Get forms
    const [forms] = await pool.query(
      'SELECT * FROM agent_forms WHERE agent_id = ?',
      [agent.id]
    );
    
    // Get views
    const [views] = await pool.query(
      'SELECT * FROM agent_views WHERE agent_id = ?',
      [agent.id]
    );
    
    res.json({
      success: true,
      data: {
        ...agent,
        menus,
        workflows,
        endpoints,
        forms,
        views
      }
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent menus
// Supported menu_type values: 'header', 'sidebar', 'footer', 'floating', 'dashboard', 'chat', 'recommendation'
app.get('/api/agents/:agentUuid/menus', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    const { menu_type } = req.query;
    
    let query = `
      SELECT am.* FROM agent_menus am
      JOIN agents a ON am.agent_id = a.id
      WHERE a.agent_uuid = ?
    `;
    const params = [agentUuid];
    
    if (menu_type) {
      query += ' AND am.menu_type = ?';
      params.push(menu_type);
    }
    
    query += ' ORDER BY am.order_no, am.id';
    
    const [menus] = await pool.query(query, params);
    res.json({ success: true, data: menus });
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent views
app.get('/api/agents/:agentUuid/views', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    const { route } = req.query;
    
    let query = `
      SELECT av.* FROM agent_views av
      JOIN agents a ON av.agent_id = a.id
      WHERE a.agent_uuid = ?
    `;
    const params = [agentUuid];
    
    if (route) {
      query += ' AND av.route = ?';
      params.push(route);
    }
    
    const [views] = await pool.query(query, params);
    res.json({ success: true, data: views });
  } catch (error) {
    console.error('Error fetching views:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get agent workflows
app.get('/api/agents/:agentUuid/workflows', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    
    const [workflows] = await pool.query(`
      SELECT aw.* FROM agent_workflows aw
      JOIN agents a ON aw.agent_id = a.id
      WHERE a.agent_uuid = ?
    `, [agentUuid]);
    
    res.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific workflow by ID
app.get('/api/agents/:agentUuid/workflows/:workflowId', async (req, res) => {
  try {
    const { agentUuid, workflowId } = req.params;
    
    const [workflows] = await pool.query(`
      SELECT aw.* FROM agent_workflows aw
      JOIN agents a ON aw.agent_id = a.id
      WHERE a.agent_uuid = ? AND aw.id = ?
    `, [agentUuid, workflowId]);
    
    if (workflows.length === 0) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    
    res.json({ success: true, data: workflows[0] });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// AGENT FORMS ROUTES
// ============================================================

// Get all forms for an agent
app.get('/api/agents/:agentUuid/forms', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    
    const [forms] = await pool.query(`
      SELECT af.* FROM agent_forms af
      JOIN agents a ON af.agent_id = a.id
      WHERE a.agent_uuid = ?
    `, [agentUuid]);
    
    res.json({ success: true, data: forms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific form by ID
app.get('/api/agents/:agentUuid/forms/:formId', async (req, res) => {
  try {
    const { agentUuid, formId } = req.params;
    
    const [forms] = await pool.query(`
      SELECT af.* FROM agent_forms af
      JOIN agents a ON af.agent_id = a.id
      WHERE a.agent_uuid = ? AND af.id = ?
    `, [agentUuid, formId]);
    
    if (forms.length === 0) {
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    
    res.json({ success: true, data: forms[0] });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit form data
app.post('/api/agents/:agentUuid/forms/:formId/submit', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { agentUuid, formId } = req.params;
    const { user_id, firm_id, submission_data } = req.body;
    
    if (!user_id || !firm_id || !submission_data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: user_id, firm_id, submission_data' 
      });
    }
    
    await connection.beginTransaction();
    
    // Get agent
    const [agents] = await connection.query(
      'SELECT id FROM agents WHERE agent_uuid = ?',
      [agentUuid]
    );
    
    if (agents.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const agent_id = agents[0].id;
    
    // Verify form exists
    const [forms] = await connection.query(
      'SELECT id FROM agent_forms WHERE id = ? AND agent_id = ?',
      [formId, agent_id]
    );
    
    if (forms.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Form not found' });
    }
    
    // Insert form submission
    const [result] = await connection.query(
      `INSERT INTO agent_form_data (agent_id, form_id, user_id, firm_id, submission_data) 
       VALUES (?, ?, ?, ?, ?)`,
      [agent_id, formId, user_id, firm_id, JSON.stringify(submission_data)]
    );
    
    // Log the action
    await connection.query(
      `INSERT INTO agent_logs (agent_id, user_id, firm_id, action, input_data, output_data) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        agent_id, 
        user_id, 
        firm_id, 
        'form_submission',
        JSON.stringify({ form_id: formId }),
        JSON.stringify({ submission_id: result.insertId })
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Form submitted successfully',
      data: { submission_id: result.insertId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// Get form submissions for an agent
app.get('/api/agents/:agentUuid/submissions', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    const { user_id, form_id } = req.query;
    
    let query = `
      SELECT afd.* FROM agent_form_data afd
      JOIN agents a ON afd.agent_id = a.id
      WHERE a.agent_uuid = ?
    `;
    const params = [agentUuid];
    
    if (user_id) {
      query += ' AND afd.user_id = ?';
      params.push(user_id);
    }
    
    if (form_id) {
      query += ' AND afd.form_id = ?';
      params.push(form_id);
    }
    
    query += ' ORDER BY afd.created_at DESC';
    
    const [submissions] = await pool.query(query, params);
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute endpoint action
app.post('/api/agents/:agentUuid/execute/:endpointName', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { agentUuid, endpointName } = req.params;
    const { user_id, firm_id, data } = req.body;
    
    // Get agent and endpoint
    const [agents] = await connection.query(
      'SELECT id FROM agents WHERE agent_uuid = ?',
      [agentUuid]
    );
    
    if (agents.length === 0) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const agent_id = agents[0].id;
    
    const [endpoints] = await connection.query(
      'SELECT * FROM agent_endpoints WHERE agent_id = ? AND endpoint_name = ?',
      [agent_id, endpointName]
    );
    
    if (endpoints.length === 0) {
      return res.status(404).json({ success: false, error: 'Endpoint not found' });
    }
    
    const endpoint = endpoints[0];
    
    // Log the action
    await connection.query(
      `INSERT INTO agent_logs (agent_id, user_id, firm_id, action, input_data) 
       VALUES (?, ?, ?, ?, ?)`,
      [agent_id, user_id, firm_id, endpointName, JSON.stringify(data)]
    );
    
    // Here you would implement the actual business logic based on endpoint configuration
    console.log(`Executing ${endpointName} for agent ${agentUuid}:`, data);
    
    res.json({
      success: true,
      message: `${endpointName} executed successfully`,
      data: { endpoint, submittedData: data }
    });
  } catch (error) {
    console.error('Error executing endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================
// AGENT CHATS ROUTES
// ============================================================

// Get chat messages for an agent
app.get('/api/agents/:agentUuid/chats', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    const { user_id, limit = 50 } = req.query;
    
    let query = `
      SELECT ac.* FROM agent_chats ac
      JOIN agents a ON ac.agent_id = a.id
      WHERE a.agent_uuid = ?
    `;
    const params = [agentUuid];
    
    if (user_id) {
      query += ' AND ac.user_id = ?';
      params.push(user_id);
    }
    
    query += ' ORDER BY ac.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [chats] = await pool.query(query, params);
    res.json({ success: true, data: chats.reverse() }); // Reverse to show oldest first
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send chat message
app.post('/api/agents/:agentUuid/chats', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { agentUuid } = req.params;
    const { user_id, message, role = 'user' } = req.body;
    
    if (!user_id || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: user_id, message' 
      });
    }
    
    // Get agent
    const [agents] = await connection.query(
      'SELECT id FROM agents WHERE agent_uuid = ?',
      [agentUuid]
    );
    
    if (agents.length === 0) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const agent_id = agents[0].id;
    
    // Insert chat message
    const [result] = await connection.query(
      `INSERT INTO agent_chats (agent_id, user_id, message, role) 
       VALUES (?, ?, ?, ?)`,
      [agent_id, user_id, message, role]
    );
    
    res.json({
      success: true,
      message: 'Chat message sent',
      data: { id: result.insertId, agent_id, user_id, message, role }
    });
  } catch (error) {
    console.error('Error sending chat:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================
// AGENT RECOMMENDATIONS ROUTES
// ============================================================

// Get recommendations for an agent
app.get('/api/agents/:agentUuid/recommendations', async (req, res) => {
  try {
    const { agentUuid } = req.params;
    const { user_id, category, limit = 10 } = req.query;
    
    let query = `
      SELECT ar.* FROM agent_recommendations ar
      JOIN agents a ON ar.agent_id = a.id
      WHERE a.agent_uuid = ?
    `;
    const params = [agentUuid];
    
    if (user_id) {
      query += ' AND (ar.user_id = ? OR ar.user_id IS NULL)';
      params.push(user_id);
    }
    
    if (category) {
      query += ' AND ar.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY ar.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [recommendations] = await pool.query(query, params);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create recommendation
app.post('/api/agents/:agentUuid/recommendations', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { agentUuid } = req.params;
    const { user_id, recommendation_text, category } = req.body;
    
    if (!recommendation_text) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required field: recommendation_text' 
      });
    }
    
    // Get agent
    const [agents] = await connection.query(
      'SELECT id FROM agents WHERE agent_uuid = ?',
      [agentUuid]
    );
    
    if (agents.length === 0) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const agent_id = agents[0].id;
    
    // Insert recommendation
    const [result] = await connection.query(
      `INSERT INTO agent_recommendations (agent_id, user_id, recommendation_text, category) 
       VALUES (?, ?, ?, ?)`,
      [agent_id, user_id || null, recommendation_text, category || null]
    );
    
    res.json({
      success: true,
      message: 'Recommendation created',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================
// CREATE AGENT WITH ALL RELATED DATA
// ============================================================
app.post('/api/agents/create-full', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { agent, menus, workflows, endpoints, forms } = req.body;
    
    if (!agent || !agent.agent_uuid || !agent.name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required agent fields: agent_uuid, name' 
      });
    }
    
    await connection.beginTransaction();
    
    // 1. Insert Agent
    const [agentResult] = await connection.query(
      `INSERT INTO agents (agent_uuid, name, description, agent_type, config_json, firm_id, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        agent.agent_uuid,
        agent.name,
        agent.description || '',
        agent.agent_type || 'general',
        JSON.stringify(agent.config_json || {}),
        agent.firm_id,
        agent.user_id
      ]
    );
    
    const agent_id = agentResult.insertId;
    
    // 2. Insert Menus
    if (menus && menus.length > 0) {
      for (const menu of menus) {
        await connection.query(
          `INSERT INTO agent_menus (agent_id, menu_type, label, route, icon, order_no) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            agent_id,
            menu.menu_type || 'sidebar',
            menu.label,
            menu.route || '',
            menu.icon || '',
            menu.order_no || 0
          ]
        );
      }
    }
    
    // 3. Insert Forms (before workflows so we can reference form IDs)
    const formIdMap = {}; // Map form names to their IDs
    if (forms && forms.length > 0) {
      for (const form of forms) {
        const [formResult] = await connection.query(
          `INSERT INTO agent_forms (agent_id, form_name, description, form_schema, created_by_user_id, firm_id) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            agent_id,
            form.form_name,
            form.description || '',
            JSON.stringify(form.form_schema || {}),
            form.created_by_user_id || agent.user_id,
            form.firm_id || agent.firm_id
          ]
        );
        formIdMap[form.form_name] = formResult.insertId;
      }
    }
    
    // 4. Insert Workflows (update form_id references)
    if (workflows && workflows.length > 0) {
      for (const workflow of workflows) {
        let stepsJson = workflow.steps_json;
        
        // If steps_json has a form_id that's a string (form name), replace with actual ID
        if (typeof stepsJson === 'object' && stepsJson.form_id) {
          const formName = stepsJson.form_id;
          if (typeof formName === 'string' && formIdMap[formName]) {
            stepsJson.form_id = formIdMap[formName];
          }
        }
        
        await connection.query(
          `INSERT INTO agent_workflows (agent_id, workflow_name, description, steps_json, trigger_event) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            agent_id,
            workflow.workflow_name,
            workflow.description || '',
            JSON.stringify(stepsJson),
            workflow.trigger_event || 'manual'
          ]
        );
      }
    }
    
    // 5. Insert Endpoints
    if (endpoints && endpoints.length > 0) {
      for (const endpoint of endpoints) {
        await connection.query(
          `INSERT INTO agent_endpoints (agent_id, endpoint_name, method, url, request_schema, response_schema, auth_required) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            agent_id,
            endpoint.endpoint_name,
            endpoint.method || 'POST',
            endpoint.url,
            JSON.stringify(endpoint.request_schema || {}),
            JSON.stringify(endpoint.response_schema || {}),
            endpoint.auth_required !== false
          ]
        );
      }
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Agent created successfully with all related data',
      data: {
        agent_id,
        agent_uuid: agent.agent_uuid,
        menus_count: menus?.length || 0,
        forms_count: forms?.length || 0,
        workflows_count: workflows?.length || 0,
        endpoints_count: endpoints?.length || 0
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating agent:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    connection.release();
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, message: 'Server and database are healthy' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
