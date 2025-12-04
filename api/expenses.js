// This file is the Vercel Serverless Function for the /api/expenses endpoint.

// In-memory data store. WARNING: Data is NOT persistent across function cold starts.
let expenses = [
    {
        id: 1,
        amount: 50.00,
        description: "Groceries",
        category: "Food",
        date: "2023-11-29"
    },
    {
        id: 2,
        amount: 15.50,
        description: "Coffee",
        category: "Food",
        date: "2023-11-29"
    },
    {
        id: 3,
        amount: 300.00,
        description: "Rent",
        category: "Housing",
        date: "2023-12-01"
    }
];

let nextId = 4;

// Standard Vercel Serverless Function entry point
export default async function handler(req, res) {
    const { method } = req;

    // Standard CORS headers for development/testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight check
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    switch (method) {
        case 'GET':
            // GET: Returns all expenses, sorted by date.
            return getExpenses(res);
        case 'POST':
            // POST: Adds a new expense with validation.
            return addExpense(req, res);
        default:
            // 405 Method Not Allowed
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
}

// --- Controller Functions ---

function getExpenses(res) {
    const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(sortedExpenses);
}

async function addExpense(req, res) {
    try {
        const expenseData = await getJsonBody(req);

        // Input validation and error handling (400 Bad Request)
        const requiredFields = ['amount', 'description', 'category', 'date'];
        for (const field of requiredFields) {
            if (!expenseData[field]) {
                return res.status(400).json({ error: `Missing required field: ${field}` });
            }
        }

        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }

        const newExpense = {
            id: nextId++,
            amount: amount.toFixed(2),
            description: expenseData.description,
            category: expenseData.category,
            date: expenseData.date
        };

        expenses.push(newExpense);

        // 201 Created
        res.status(201).json(newExpense);

    } catch (error) {
        // Handle invalid JSON body
        res.status(400).json({ error: 'Invalid JSON request body' });
    }
}

// Helper to reliably parse the incoming JSON request body
function getJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
