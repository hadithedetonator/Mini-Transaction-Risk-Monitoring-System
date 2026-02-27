/**
 * Evaluates fraud rules for a single transaction.
 * 
 * @param {Object} transaction - The transaction object (amount, user_id, etc.)
 * @param {number} userTransactionCount - The number of existing transactions in the DB for this user.
 * @returns {Object} - { risk_flag: string|null, rule_triggered: string|null }
 */
function evaluateRisk(transaction, userTransactionCount) {
    // Rule 1: High Amount Check (Primary Priority)
    if (transaction.amount > 20000) {
        return {
            risk_flag: "HIGH_RISK",
            rule_triggered: "Rule1"
        };
    }

    // Rule 2: Frequency Check (Secondary Priority)
    // Logic: "More than 3" means the 4th transaction triggers the flag.
    if (userTransactionCount >= 3) {
        return {
            risk_flag: "SUSPICIOUS",
            rule_triggered: "Rule2"
        };
    }

    return {
        risk_flag: null,
        rule_triggered: null
    };
}

module.exports = { evaluateRisk };
