const base_url = "http://localhost:8080/api/v1";

export async function loginapi(email, password) {
    const response = await fetch(`${base_url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            email: email,
            password: password
        })
    });
    if (!response.ok) throw new Error("login failed");
    return await response.json();
}

export async function refreshapi() {
    const response = await fetch(`${base_url}/auth/refresh`, {
        method: "POST",
        
        credentials: "include"
    });
    if (!response.ok) throw new Error("refresh token failed");
    return await response.json();
}