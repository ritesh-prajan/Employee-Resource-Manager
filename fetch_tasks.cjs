const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  try {
    const loginData = JSON.stringify({ email: 'admin@teamops.com', password: 'admin123' });
    const loginRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);

    const setCookie = loginRes.headers['set-cookie'];
    const adminCookie = setCookie ? setCookie[0].split(';')[0] : '';
    console.log('Admin logged in. Cookie:', adminCookie);

    // Get current employee 26 details
    const getEmpRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/employees/26',
      method: 'GET',
      headers: { 'Cookie': adminCookie }
    });
    const emp26 = JSON.parse(getEmpRes.data);

    // Reset password for wqert@qwe.com (Employee 26)
    const updatePayload = JSON.stringify({
      ...emp26,
      user: {
        ...emp26.user,
        rawPassword: "employee123"
      }
    });

    const resetRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/employees/26',
      method: 'PUT',
      headers: {
        'Cookie': adminCookie,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(updatePayload)
      }
    }, updatePayload);

    console.log('Password reset response status:', resetRes.statusCode);

    // 2. Log in as wqert@qwe.com
    const tlLoginData = JSON.stringify({ email: 'wqert@qwe.com', password: 'employee123' });
    const tlLoginRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(tlLoginData)
      }
    }, tlLoginData);

    console.log('TL login status:', tlLoginRes.statusCode);
    if (tlLoginRes.statusCode !== 200) {
      console.log('TL login failed:', tlLoginRes.data);
      return;
    }

    const tlCookie = tlLoginRes.headers['set-cookie'][0].split(';')[0];
    console.log('TL logged in. Cookie:', tlCookie);

    // 3. TL joins project 4 (AAM)
    const joinRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/projects/4/employees/26',
      method: 'POST',
      headers: { 'Cookie': tlCookie }
    });
    console.log('TL project join status:', joinRes.statusCode);
    console.log('TL project join response:', joinRes.data);

    // 4. TL claims task 7
    const patchPayload = JSON.stringify({
      taskNumber: "TSK-006",
      title: "Bug Fix Implementation and Testing ",
      description: "",
      taskType: "BUG",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      etaHours: 8,
      etaDate: "2026-06-25",
      bugNumber: "CCS-13588 ",
      epic: "Backlog",
      assignedTo: { id: 26 },
      project: { id: 4 }
    });

    const patchRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/v1/tasks/7',
      method: 'PATCH',
      headers: {
        'Cookie': tlCookie,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(patchPayload)
      }
    }, patchPayload);

    console.log('TL Task Claim PATCH status:', patchRes.statusCode);
    console.log('TL Task Claim PATCH response:', patchRes.data);

  } catch (err) {
    console.error('Error running script:', err);
  }
}

run();
