export const ACHIEVEMENTS = [
    {
        id: 'savings_starter',
        title: 'Savings Starter',
        description: 'Make your first goal deposit',
        rewardXP: 100,
        type: 'wealth',
        icon: '💰',
        check: (stats, goals, deposits) => deposits.length > 0
    },
    {
        id: 'budget_master',
        title: 'Budget Master',
        description: 'Have at least 3 active budgets set',
        rewardXP: 150,
        type: 'frugality',
        icon: '🛡️',
        check: (stats, goals, deposits, todos, habits, budgets) => budgets.length >= 3
    },
    {
        id: 'productivity_ninja',
        title: 'Productivity Ninja',
        description: 'Complete 10 tasks in total',
        rewardXP: 200,
        type: 'consistency',
        icon: '🥷',
        check: (stats, goals, deposits, todos) => todos.filter(t => t.completed).length >= 10
    },
    {
        id: 'debt_slayer',
        title: 'Debt Slayer',
        description: 'Reduce total debt to zero',
        rewardXP: 500,
        type: 'wealth',
        icon: '⚔️',
        check: (stats) => stats.totalDebt === 0 && stats.totalSpent > 0
    },
    {
        id: 'early_bird',
        title: 'Early Bird',
        description: 'Complete a task before 9 AM',
        rewardXP: 100,
        type: 'consistency',
        icon: '🌅',
        check: (stats, goals, deposits, todos) => {
            return todos.some(t => {
                if (!t.completed || !t.updatedAt) return false;
                const d = t.updatedAt.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
                return d.getHours() < 9;
            });
        }
    },
    {
        id: 'frugal_streak',
        title: 'Frugal Streak',
        description: 'Spend less than 500 BDT for 3 days in a row',
        rewardXP: 300,
        type: 'frugality',
        icon: '🔥',
        check: (stats) => {
            // This would ideally check history, but for now we check current stats
            return stats.totalSpent < 500 && stats.totalSpent > 0; // Simple placeholder
        }
    },
    {
        id: 'big_spender',
        title: 'High Roller',
        description: 'Log a purchase over 5,000 BDT',
        rewardXP: 50,
        type: 'wealth',
        icon: '💎',
        check: (stats, goals, deposits, todos, habits, budgets, meals, purchases) => purchases.some(p => Number(p.amount) >= 5000)
    }
];
