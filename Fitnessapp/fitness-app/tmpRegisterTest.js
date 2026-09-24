(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Test Sportif',
        email: 'test.sportif@example.com',
        motDePasse: 'Password123!',
        age: 28,
        poids: 70,
        taille: 175,
        objectif_principal: 'Endurance'
      })
    });
    const data = await res.json();
    console.log('status', res.status);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
