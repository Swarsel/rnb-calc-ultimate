/**
 * Calculator Integration for Battle Planner
 * 
 * Wraps the existing @smogon/calc engine to provide:
 * - Multiple outcome scenarios (crit/no-crit, hit/miss)
 * - Damage ranges with probability weighting
 * - State transitions based on move effects
 */

(function(window) {
    'use strict';
    
    // Wait for BattlePlanner to be available
    if (!window.BattlePlanner) {
        setTimeout(function() {
            // Re-execute this IIFE
            window.BattlePlannerCalcIntegration && window.BattlePlannerCalcIntegration();
        }, 100);
        return;
    }
    
    var BattlePlanner = window.BattlePlanner;
    var calc = window.calc;
    
    /**
     * Calculate all possible outcomes for a move
     */
    function calculateAllOutcomes(attacker, defender, move, field, gen) {
        gen = gen || window.GENERATION || (calc && calc.Generations ? calc.Generations.get(8) : 8);
        field = field || (calc ? new calc.Field() : null);
        
        var outcomes = [];
        
        if (!calc || !attacker || !defender || !move) {
            return outcomes;
        }
        
        // Get move data
        var moveName = move.name || move;
        var moveData = null;
        
        try {
            if (gen && gen.moves) {
                moveData = gen.moves.get(calc.toID(moveName));
            }
        } catch(e) { }
        
        if (!moveData) {
            // Return a simple placeholder outcome
            return [{
                type: 'unknown',
                label: 'Unknown Move',
                probability: 1,
                damage: 0,
                effects: {}
            }];
        }
        
        // Calculate accuracy
        var accuracy = getAccuracy(moveData, attacker, defender, field, gen);
        var missChance = accuracy < 100 ? (100 - accuracy) / 100 : 0;
        var hitChance = 1 - missChance;
        
        // Calculate crit chance
        var critChance = getCritChance(move, attacker, defender, field, gen);
        
        // Miss outcome
        if (missChance > 0) {
            outcomes.push(new BattlePlanner.BattleOutcome(
                'Miss',
                missChance,
                0,
                { miss: true }
            ));
        }
        
        // Normal hit (no crit)
        if (hitChance > 0 && critChance < 1) {
            try {
                var normalResult = calc.calculate(gen, attacker, defender, move, field);
                var normalDamageRange = getDamageRange(normalResult);
                
                // Low roll
                outcomes.push(new BattlePlanner.BattleOutcome(
                    'Low Roll',
                    hitChance * (1 - critChance) * 0.0625,
                    normalDamageRange.min,
                    { lowRoll: true }
                ));
                
                // Normal (average)
                outcomes.push(new BattlePlanner.BattleOutcome(
                    'Normal',
                    hitChance * (1 - critChance) * 0.875,
                    normalDamageRange.avg,
                    {}
                ));
                
                // High roll
                outcomes.push(new BattlePlanner.BattleOutcome(
                    'High Roll',
                    hitChance * (1 - critChance) * 0.0625,
                    normalDamageRange.max,
                    { highRoll: true }
                ));
            } catch(e) {
                console.error('Failed to calculate normal hit:', e);
            }
        }
        
        // Crit hit
        if (hitChance > 0 && critChance > 0) {
            try {
                var critMove = move;
                if (move.clone) {
                    critMove = move.clone();
                    critMove.isCrit = true;
                }
                var critResult = calc.calculate(gen, attacker, defender, critMove, field);
                var critDamageRange = getDamageRange(critResult);
                
                // Crit low
                outcomes.push(new BattlePlanner.BattleOutcome(
                    'Crit (Low)',
                    hitChance * critChance * 0.0625,
                    critDamageRange.min,
                    { crit: true, lowRoll: true }
                ));
                
                // Crit average
                outcomes.push(new BattlePlanner.BattleOutcome(
                    'Crit',
                    hitChance * critChance * 0.875,
                    critDamageRange.avg,
                    { crit: true }
                ));
                
                // Crit high
                outcomes.push(new BattlePlanner.BattleOutcome(
                    'Crit (High)',
                    hitChance * critChance * 0.0625,
                    critDamageRange.max,
                    { crit: true, highRoll: true }
                ));
            } catch(e) {
                console.error('Failed to calculate crit:', e);
            }
        }
        
        // Simplify by merging low probability outcomes
        outcomes = simplifyOutcomes(outcomes);
        
        return outcomes;
    }
    
    /**
     * Calculate simplified key outcomes (for UI display)
     */
    function calculateKeyOutcomes(attacker, defender, move, field, gen) {
        gen = gen || window.GENERATION || (calc && calc.Generations ? calc.Generations.get(8) : 8);
        field = field || (calc ? new calc.Field() : null);
        
        var outcomes = [];
        
        if (!calc || !attacker || !defender || !move) {
            return outcomes;
        }
        
        var moveName = move.name || move;
        var moveData = null;
        
        try {
            if (gen && gen.moves) {
                moveData = gen.moves.get(calc.toID(moveName));
            }
        } catch(e) { }
        
        if (!moveData) {
            return [{
                type: 'unknown',
                label: 'Unknown',
                probability: 1,
                damage: 0,
                damageRange: { min: 0, max: 0, avg: 0 },
                effects: {}
            }];
        }
        
        var accuracy = getAccuracy(moveData, attacker, defender, field, gen);
        var missChance = accuracy < 100 ? (100 - accuracy) / 100 : 0;
        var hitChance = 1 - missChance;
        var critChance = getCritChance(move, attacker, defender, field, gen);
        
        // Miss outcome (only show if 5%+)
        if (missChance >= 0.05) {
            outcomes.push({
                type: 'miss',
                label: 'Miss',
                probability: missChance,
                damage: 0,
                damageRange: { min: 0, max: 0, avg: 0 },
                effects: { miss: true }
            });
        }
        
        // Normal hit
        if (hitChance > 0 && (1 - critChance) > 0) {
            try {
                var normalResult = calc.calculate(gen, attacker, defender, move, field);
                var normalRange = getDamageRange(normalResult);
                
                outcomes.push({
                    type: 'normal',
                    label: 'Normal',
                    probability: hitChance * (1 - critChance),
                    damage: normalRange.avg,
                    damageRange: normalRange,
                    effects: {},
                    result: normalResult
                });
            } catch(e) {
                console.error('Failed to calc normal:', e);
            }
        }
        
        // Crit
        if (hitChance > 0 && critChance > 0.01) { // Only show if > 1%
            try {
                var critMove = move;
                if (move.clone) {
                    critMove = move.clone();
                    critMove.isCrit = true;
                }
                var critResult = calc.calculate(gen, attacker, defender, critMove, field);
                var critRange = getDamageRange(critResult);
                
                outcomes.push({
                    type: 'crit',
                    label: 'Critical Hit',
                    probability: hitChance * critChance,
                    damage: critRange.avg,
                    damageRange: critRange,
                    effects: { crit: true },
                    result: critResult
                });
            } catch(e) {
                console.error('Failed to calc crit:', e);
            }
        }
        
        return outcomes;
    }
    
    /**
     * Get accuracy considering all modifiers
     */
    function getAccuracy(moveData, attacker, defender, field, gen) {
        if (!moveData) return 100;
        
        // Always-hit moves
        if (moveData.accuracy === true || moveData.accuracy === 0) return 100;
        
        var baseAccuracy = moveData.accuracy || 100;
        
        // Ability modifiers
        var attackerAbility = attacker ? (attacker.ability || '') : '';
        var defenderAbility = defender ? (defender.ability || '') : '';
        
        if (attackerAbility === 'No Guard' || defenderAbility === 'No Guard') {
            return 100;
        }
        if (attackerAbility === 'Compound Eyes') {
            baseAccuracy = Math.floor(baseAccuracy * 1.3);
        }
        if (attackerAbility === 'Hustle' && moveData.category === 'Physical') {
            baseAccuracy = Math.floor(baseAccuracy * 0.8);
        }
        
        // Item modifiers
        var attackerItem = attacker ? (attacker.item || '') : '';
        if (attackerItem === 'Wide Lens') {
            baseAccuracy = Math.floor(baseAccuracy * 1.1);
        }
        
        // Weather modifiers
        var weather = field && field.weather ? field.weather : '';
        var moveName = moveData.name || '';
        
        if (moveName === 'Thunder' || moveName === 'Hurricane') {
            if (weather === 'Rain' || weather === 'Heavy Rain') {
                return 100;
            }
            if (weather === 'Sun' || weather === 'Harsh Sunshine') {
                baseAccuracy = 50;
            }
        }
        if (moveName === 'Blizzard' && (weather === 'Hail' || weather === 'Snow')) {
            return 100;
        }
        
        // Gravity
        if (field && field.isGravity) {
            baseAccuracy = Math.floor(baseAccuracy * 5 / 3);
        }
        
        return Math.min(100, baseAccuracy);
    }
    
    /**
     * Get crit chance as a decimal
     */
    function getCritChance(move, attacker, defender, field, gen) {
        if (!move) return 0;
        
        var moveName = move.name || '';
        
        // Always-crit moves
        var alwaysCrit = ['Storm Throw', 'Frost Breath', 'Zippy Zap', 'Surging Strikes', 'Wicked Blow'];
        if (alwaysCrit.indexOf(moveName) !== -1) return 1;
        
        // Abilities that prevent crits
        var defenderAbility = defender ? (defender.ability || '') : '';
        if (defenderAbility === 'Battle Armor' || defenderAbility === 'Shell Armor') {
            return 0;
        }
        
        // Calculate crit stage
        var critStage = 0;
        
        // High crit moves
        var highCritMoves = [
            'Slash', 'Karate Chop', 'Razor Leaf', 'Crabhammer', 'Shadow Claw',
            'Stone Edge', 'Cross Chop', 'Aeroblast', 'Night Slash', 'Psycho Cut',
            'Spacial Rend', 'Air Cutter', 'Attack Order', 'Blaze Kick', 'Cross Poison',
            'Drill Run', 'Leaf Blade', 'Poison Tail', 'Sky Attack', 'Shadow Blast'
        ];
        if (highCritMoves.indexOf(moveName) !== -1) critStage++;
        
        // Item-based stages
        var attackerItem = attacker ? (attacker.item || '') : '';
        var attackerAbility = attacker ? (attacker.ability || '') : '';
        var attackerName = attacker ? (attacker.name || '') : '';
        
        if (attackerItem === 'Scope Lens' || attackerItem === 'Razor Claw') critStage++;
        if (attackerItem === 'Leek' && (attackerName === "Farfetch'd" || attackerName === "Sirfetch'd")) critStage += 2;
        if (attackerItem === 'Lucky Punch' && attackerName === 'Chansey') critStage += 2;
        if (attackerItem === 'Stick' && attackerName === "Farfetch'd") critStage += 2;
        
        // Ability-based stages
        if (attackerAbility === 'Super Luck') critStage++;
        
        // Convert stage to chance
        var genNum = 8;
        if (gen && gen.num) {
            genNum = gen.num;
        } else if (typeof gen === 'number') {
            genNum = gen;
        }
        
        if (genNum >= 7) {
            var rates = [1/24, 1/8, 1/2, 1, 1];
            return rates[Math.min(critStage, 4)];
        } else {
            var rates = [1/16, 1/8, 1/4, 1/3, 1/2];
            return rates[Math.min(critStage, 4)];
        }
    }
    
    /**
     * Extract damage range from result
     */
    function getDamageRange(result) {
        if (!result) return { min: 0, max: 0, avg: 0, rolls: [] };
        
        var damage = result.damage;
        var min = 0, max = 0, avg = 0;
        
        if (typeof damage === 'number') {
            min = max = avg = damage;
        } else if (Array.isArray(damage)) {
            if (damage.length === 2 && Array.isArray(damage[0])) {
                // Parental Bond
                var d0 = damage[0];
                var d1 = damage[1];
                min = d0[0] + d1[0];
                max = d0[d0.length - 1] + d1[d1.length - 1];
                avg = Math.floor((min + max) / 2);
            } else if (damage.length > 0) {
                min = Math.min.apply(null, damage);
                max = Math.max.apply(null, damage);
                var sum = 0;
                for (var i = 0; i < damage.length; i++) {
                    sum += damage[i];
                }
                avg = Math.floor(sum / damage.length);
            }
        }
        
        return {
            min: min,
            max: max,
            avg: avg,
            rolls: damage
        };
    }
    
    /**
     * Simplify outcomes by filtering low probability ones
     */
    function simplifyOutcomes(outcomes, threshold) {
        threshold = threshold || 0.01;
        
        var significant = outcomes.filter(function(o) {
            return o.probability >= threshold;
        });
        
        var remainingProb = 0;
        outcomes.forEach(function(o) {
            if (o.probability < threshold) {
                remainingProb += o.probability;
            }
        });
        
        if (remainingProb > 0 && significant.length > 0) {
            significant[0].probability += remainingProb;
        }
        
        return significant;
    }
    
    /**
     * Apply an outcome to a battle state
     */
    function applyOutcomeToState(state, outcome, attackerSide, moveData) {
        var newState = state.clone();
        newState.turnNumber++;
        
        var attacker = attackerSide === 'p1' ? newState.p1.active : newState.p2.active;
        var defender = attackerSide === 'p1' ? newState.p2.active : newState.p1.active;
        
        if (!defender || !attacker) return newState;
        
        // Apply damage
        var damage = outcome.damage || outcome.damageDealt || 0;
        if (damage > 0) {
            defender.applyDamage(damage);
        }
        
        return newState;
    }
    
    /**
     * Create a Pokemon object from a snapshot for calculation
     */
    function snapshotToPokemon(snapshot, gen) {
        if (!snapshot) return null;
        
        // If we have stored Pokemon data, use it
        if (snapshot._pokemonData) {
            var pokemon = snapshot._pokemonData;
            if (pokemon.clone) {
                var cloned = pokemon.clone();
                // Update with current snapshot values
                if (typeof snapshot.currentHP === 'number') {
                    cloned.originalCurHP = snapshot.currentHP;
                }
                if (snapshot.status) {
                    cloned.status = snapshot._statusNameToCode ? snapshot._statusNameToCode(snapshot.status) : '';
                }
                if (snapshot.boosts) {
                    cloned.boosts = Object.assign({}, snapshot.boosts);
                }
                return cloned;
            }
            return pokemon;
        }
        
        // Try to create a new Pokemon from snapshot data
        if (!window.calc || !snapshot.name) return null;
        
        try {
            var genNum = 8;
            if (gen && gen.num) genNum = gen.num;
            else if (typeof gen === 'number') genNum = gen;
            
            var options = {
                level: snapshot.level || 100,
                ability: snapshot.ability || '',
                item: snapshot.item || '',
                nature: snapshot.nature || 'Hardy',
                evs: snapshot.evs || {},
                ivs: snapshot.ivs || {},
                boosts: snapshot.boosts || {},
                curHP: snapshot.currentHP
            };
            
            // Add moves
            if (snapshot.moves && snapshot.moves.length > 0) {
                options.moves = snapshot.moves.map(function(moveName) {
                    return new window.calc.Move(genNum, moveName);
                });
            }
            
            return new window.calc.Pokemon(genNum, snapshot.name, options);
        } catch(e) {
            console.error('Failed to create Pokemon from snapshot:', e);
            return null;
        }
    }
    
    /**
     * Create a BattleStateSnapshot from current calculator state
     */
    function createStateFromCalculator(p1Pokemon, p2Pokemon, field) {
        var state = new BattlePlanner.BattleStateSnapshot();
        
        if (p1Pokemon) {
            state.p1.active = new BattlePlanner.PokemonSnapshot(p1Pokemon);
            state.p1.team = [state.p1.active.clone()];
            state.p1.teamSlot = 0;
        }
        if (p2Pokemon) {
            state.p2.active = new BattlePlanner.PokemonSnapshot(p2Pokemon);
            state.p2.team = [state.p2.active.clone()];
            state.p2.teamSlot = 0;
        }
        
        if (field) {
            state.field.weather = field.weather || 'None';
            state.field.terrain = field.terrain || 'None';
            state.field.trickRoom = !!field.isTrickRoom;
            state.field.gravity = !!field.isGravity;
            
            if (field.attackerSide) {
                var as = field.attackerSide;
                state.sides.p1.spikes = as.spikes || 0;
                state.sides.p1.stealthRock = !!as.isSR;
                state.sides.p1.reflect = !!as.isReflect;
                state.sides.p1.lightScreen = !!as.isLightScreen;
                state.sides.p1.tailwind = !!as.isTailwind;
            }
            
            if (field.defenderSide) {
                var ds = field.defenderSide;
                state.sides.p2.spikes = ds.spikes || 0;
                state.sides.p2.stealthRock = !!ds.isSR;
                state.sides.p2.reflect = !!ds.isReflect;
                state.sides.p2.lightScreen = !!ds.isLightScreen;
                state.sides.p2.tailwind = !!ds.isTailwind;
            }
        }
        
        return state;
    }
    
    /**
     * Format probability as percentage
     */
    function formatProbability(probability) {
        var percent = probability * 100;
        if (percent >= 99.99) return '100%';
        if (percent <= 0.01) return '<0.1%';
        if (percent >= 10) return percent.toFixed(1) + '%';
        return percent.toFixed(2) + '%';
    }
    
    /**
     * Format damage as percentage of max HP
     */
    function formatDamagePercent(damage, maxHP) {
        if (!maxHP || maxHP <= 0) return '0%';
        var percent = (damage / maxHP) * 100;
        return percent.toFixed(1) + '%';
    }
    
    // Export
    window.BattlePlanner.CalcIntegration = {
        calculateAllOutcomes: calculateAllOutcomes,
        calculateKeyOutcomes: calculateKeyOutcomes,
        getAccuracy: getAccuracy,
        getCritChance: getCritChance,
        getDamageRange: getDamageRange,
        applyOutcomeToState: applyOutcomeToState,
        snapshotToPokemon: snapshotToPokemon,
        createStateFromCalculator: createStateFromCalculator,
        formatProbability: formatProbability,
        formatDamagePercent: formatDamagePercent
    };
    
})(window);
