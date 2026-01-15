/**
 * Battle Planner UI
 * 
 * Renders the battle planner interface with:
 * - Timeline tree visualization
 * - Pokemon card views with animated HP bars
 * - Team management panels
 * - Speed comparison and battle info
 * - Probability cloud for outcome branching
 * - State inspector
 */

(function(window, $) {
    'use strict';
    
    var BattlePlanner = window.BattlePlanner;
    var CalcIntegration = null; // Will be set after CalcIntegration loads
    
    // UI State
    var uiState = {
        tree: null,
        isVisible: false,
        selectedOutcome: null,
        selectedMove: null,
        currentOutcomes: null,
        expandedNodes: {},
        viewMode: 'split',
        animationsEnabled: true,
        showTeamPanel: true,
        selectedAttacker: 'p1'
    };
    
    // DOM References
    var $container = null;
    var $treePanel = null;
    var $stagePanel = null;
    var $inspectorPanel = null;
    
    /**
     * Initialize the Battle Planner UI
     */
    function initialize() {
        // Wait for CalcIntegration to be available
        if (!BattlePlanner.CalcIntegration) {
            setTimeout(initialize, 100);
            return;
        }
        CalcIntegration = BattlePlanner.CalcIntegration;
        
        createPlannerUI();
        setupEventHandlers();
        
        // Create tree instance
        uiState.tree = new BattlePlanner.BattleTree();
        uiState.tree.onTreeUpdated = onTreeUpdated;
        uiState.tree.onCurrentNodeChanged = onCurrentNodeChanged;
        
        console.log('Battle Planner UI initialized');
    }
    
    /**
     * Create the main planner UI structure
     */
    function createPlannerUI() {
        var html = `
            <div id="battle-planner" class="battle-planner-container" style="display: none;">
                <div class="planner-header">
                    <h2 class="planner-title">
                        <span class="planner-icon">⚔️</span>
                        Battle Planner
                    </h2>
                    <div class="planner-controls">
                        <button class="planner-btn planner-btn-view active" data-view="split" title="Split View">Split</button>
                        <button class="planner-btn planner-btn-view" data-view="tree" title="Tree View">Tree</button>
                        <button class="planner-btn planner-btn-view" data-view="stage" title="Stage View">Stage</button>
                        <span class="planner-separator">|</span>
                        <button class="planner-btn planner-btn-action" id="planner-new" title="New Battle">New</button>
                        <button class="planner-btn planner-btn-action" id="planner-import" title="Import State">Import</button>
                        <button class="planner-btn planner-btn-action" id="planner-export" title="Export Plan">Export</button>
                        <button class="planner-btn planner-btn-help" id="planner-help" title="How to Use">?</button>
                        <button class="planner-btn planner-btn-close" id="planner-close" title="Close Planner">×</button>
                    </div>
                </div>
                
                <div class="planner-body">
                    <!-- Timeline Tree Panel -->
                    <div class="planner-panel planner-tree-panel">
                        <div class="panel-header">
                            <span class="panel-title">TIMELINE</span>
                            <div class="panel-actions">
                                <button class="panel-btn" id="tree-expand-all" title="Expand All">▼</button>
                                <button class="panel-btn" id="tree-collapse-all" title="Collapse All">▶</button>
                            </div>
                        </div>
                        <div class="panel-content" id="tree-container">
                            <div class="tree-placeholder">
                                <div class="placeholder-icon">📋</div>
                                <p class="placeholder-title">No Battle Started</p>
                                <p class="placeholder-desc">Start a battle simulation to plan your moves</p>
                                <button class="planner-btn planner-btn-primary" id="tree-start-battle">
                                    Load from Calculator
                                </button>
                                <button class="planner-btn planner-btn-secondary" id="tree-start-imported">
                                    Use Imported Team
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Round Stage Panel -->
                    <div class="planner-panel planner-stage-panel">
                        <div class="panel-header">
                            <span class="panel-title" id="stage-turn-label">TURN 0</span>
                            <div class="panel-actions">
                                <button class="panel-btn" id="stage-prev" title="Previous Turn">◀</button>
                                <button class="panel-btn" id="stage-next" title="Next Turn">▶</button>
                            </div>
                        </div>
                        <div class="panel-content" id="stage-container">
                            <!-- Speed Comparison Bar -->
                            <div class="speed-comparison-bar" id="speed-comparison">
                                <span class="speed-icon">⚡</span>
                                <span class="speed-text" id="speed-text">--</span>
                            </div>
                            
                            <div class="stage-field">
                                <!-- P1 Pokemon Card -->
                                <div class="pokemon-card pokemon-card-p1" id="stage-p1">
                                    <div class="card-header">
                                        <span class="card-label">PLAYER</span>
                                        <button class="card-switch-btn" id="p1-switch-btn" title="Switch Pokemon">⇄</button>
                                    </div>
                                    <div class="card-body">
                                        <div class="card-sprite-container">
                                            <img class="card-sprite" id="stage-p1-sprite" src="" alt="P1">
                                            <div class="card-types" id="stage-p1-types"></div>
                                        </div>
                                        <div class="card-info">
                                            <div class="card-name" id="stage-p1-name">---</div>
                                            <div class="card-details">
                                                <span class="card-level" id="stage-p1-level">Lv. --</span>
                                                <span class="card-ability" id="stage-p1-ability"></span>
                                            </div>
                                            <div class="card-hp-container">
                                                <div class="card-hp-bar">
                                                    <div class="card-hp-fill" id="stage-p1-hp-fill"></div>
                                                    <div class="card-hp-shadow" id="stage-p1-hp-shadow"></div>
                                                </div>
                                                <span class="card-hp-text" id="stage-p1-hp-text">---/---</span>
                                            </div>
                                            <div class="card-status-boosts">
                                                <span class="card-status" id="stage-p1-status"></span>
                                                <span class="card-item" id="stage-p1-item"></span>
                                            </div>
                                            <div class="card-boosts" id="stage-p1-boosts"></div>
                                            <div class="card-stats-mini" id="stage-p1-stats-mini"></div>
                                        </div>
                                    </div>
                                    <div class="card-moves" id="stage-p1-moves"></div>
                                </div>
                                
                                <!-- VS Indicator -->
                                <div class="stage-vs">
                                    <span class="vs-text">VS</span>
                                    <div class="vs-matchup" id="vs-matchup"></div>
                                </div>
                                
                                <!-- P2 Pokemon Card -->
                                <div class="pokemon-card pokemon-card-p2" id="stage-p2">
                                    <div class="card-header">
                                        <span class="card-label">OPPONENT</span>
                                        <button class="card-switch-btn" id="p2-switch-btn" title="Switch Pokemon">⇄</button>
                                    </div>
                                    <div class="card-body">
                                        <div class="card-sprite-container">
                                            <img class="card-sprite" id="stage-p2-sprite" src="" alt="P2">
                                            <div class="card-types" id="stage-p2-types"></div>
                                        </div>
                                        <div class="card-info">
                                            <div class="card-name" id="stage-p2-name">---</div>
                                            <div class="card-details">
                                                <span class="card-level" id="stage-p2-level">Lv. --</span>
                                                <span class="card-ability" id="stage-p2-ability"></span>
                                            </div>
                                            <div class="card-hp-container">
                                                <div class="card-hp-bar">
                                                    <div class="card-hp-fill" id="stage-p2-hp-fill"></div>
                                                    <div class="card-hp-shadow" id="stage-p2-hp-shadow"></div>
                                                </div>
                                                <span class="card-hp-text" id="stage-p2-hp-text">---/---</span>
                                            </div>
                                            <div class="card-status-boosts">
                                                <span class="card-status" id="stage-p2-status"></span>
                                                <span class="card-item" id="stage-p2-item"></span>
                                            </div>
                                            <div class="card-boosts" id="stage-p2-boosts"></div>
                                            <div class="card-stats-mini" id="stage-p2-stats-mini"></div>
                                        </div>
                                    </div>
                                    <div class="card-moves" id="stage-p2-moves"></div>
                                </div>
                            </div>
                            
                            <!-- Team Preview Panels -->
                            <div class="team-panels">
                                <div class="team-panel team-panel-p1" id="team-panel-p1">
                                    <div class="team-header">Your Team</div>
                                    <div class="team-slots" id="team-slots-p1"></div>
                                </div>
                                <div class="team-panel team-panel-p2" id="team-panel-p2">
                                    <div class="team-header">Opponent's Team</div>
                                    <div class="team-slots" id="team-slots-p2"></div>
                                </div>
                            </div>
                            
                            <!-- Probability Cloud -->
                            <div class="probability-cloud" id="probability-cloud">
                                <div class="cloud-header">
                                    <span class="cloud-title">Outcome Branches</span>
                                    <span class="cloud-hint">Click to create branch</span>
                                </div>
                                <div class="cloud-outcomes" id="cloud-outcomes">
                                    <p class="cloud-empty">Select a move to see possible outcomes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- State Inspector Panel -->
                    <div class="planner-panel planner-inspector-panel">
                        <div class="panel-header">
                            <span class="panel-title">INSPECTOR</span>
                            <div class="panel-actions">
                                <button class="panel-btn panel-collapse-btn" id="inspector-collapse" title="Collapse">◀</button>
                            </div>
                        </div>
                        <div class="panel-content" id="inspector-container">
                            <div class="inspector-section">
                                <h4>Node Info</h4>
                                <div class="inspector-grid">
                                    <div class="inspector-field">
                                        <label>Turn:</label>
                                        <span id="inspector-turn">0</span>
                                    </div>
                                    <div class="inspector-field">
                                        <label>Probability:</label>
                                        <span id="inspector-probability">100%</span>
                                    </div>
                                    <div class="inspector-field inspector-field-wide">
                                        <label>Action:</label>
                                        <span id="inspector-action">-</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="inspector-section">
                                <h4>Field Conditions</h4>
                                <div class="inspector-grid">
                                    <div class="inspector-field">
                                        <label>Weather:</label>
                                        <span id="inspector-weather">None</span>
                                    </div>
                                    <div class="inspector-field">
                                        <label>Terrain:</label>
                                        <span id="inspector-terrain">None</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="inspector-section">
                                <h4>Player Side</h4>
                                <div class="inspector-tags" id="inspector-p1-effects"></div>
                            </div>
                            
                            <div class="inspector-section">
                                <h4>Opponent Side</h4>
                                <div class="inspector-tags" id="inspector-p2-effects"></div>
                            </div>
                            
                            <div class="inspector-section">
                                <h4>Notes</h4>
                                <textarea id="inspector-notes" placeholder="Add strategy notes..."></textarea>
                            </div>
                            
                            <div class="inspector-actions">
                                <button class="planner-btn planner-btn-danger" id="inspector-delete-node">
                                    Delete Branch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Help Modal -->
            <div id="planner-help-modal" class="planner-modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📖 Battle Planner Guide</h3>
                        <button class="modal-close" id="help-modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="guide-section">
                            <h4>🎯 What is the Battle Planner?</h4>
                            <p>The Battle Planner lets you simulate and plan Pokemon battles turn by turn. 
                            You can explore different move choices and see how the battle could play out under different scenarios (crits, misses, damage rolls).</p>
                        </div>
                        
                        <div class="guide-section">
                            <h4>🚀 Getting Started</h4>
                            <ol>
                                <li><strong>Set up Pokemon</strong> in the main calculator first</li>
                                <li>Click <strong>"Load from Calculator"</strong> to start planning</li>
                                <li>Or use <strong>"Use Imported Team"</strong> if you've loaded a savefile</li>
                            </ol>
                        </div>
                        
                        <div class="guide-section">
                            <h4>⚔️ Planning Moves</h4>
                            <ol>
                                <li>Click a <strong>move button</strong> on either Pokemon's card</li>
                                <li>The <strong>Outcome Branches</strong> panel shows possible results</li>
                                <li>Click an outcome to <strong>create a branch</strong> in the timeline</li>
                                <li>Each branch represents a different way the battle could go</li>
                            </ol>
                        </div>
                        
                        <div class="guide-section">
                            <h4>🌳 Using the Timeline</h4>
                            <ul>
                                <li>Click any node to <strong>jump to that point</strong> in the battle</li>
                                <li><span class="badge badge-best">Green</span> nodes = best case scenario</li>
                                <li><span class="badge badge-worst">Red</span> nodes = worst case scenario</li>
                                <li>Use ◀ ▶ buttons to navigate turns</li>
                            </ul>
                        </div>
                        
                        <div class="guide-section">
                            <h4>📊 Understanding the Display</h4>
                            <ul>
                                <li><strong>Speed Bar</strong>: Shows who moves first</li>
                                <li><strong>HP Bars</strong>: Current health with damage previews</li>
                                <li><strong>Outcome %</strong>: Probability of each result</li>
                                <li><strong>Damage Range</strong>: Min to max damage possible</li>
                            </ul>
                        </div>
                        
                        <div class="guide-section">
                            <h4>⌨️ Keyboard Shortcuts</h4>
                            <ul>
                                <li><kbd>P</kbd> - Toggle planner open/close</li>
                                <li><kbd>Esc</kbd> - Close planner</li>
                                <li><kbd>←</kbd> / <kbd>→</kbd> - Navigate turns</li>
                            </ul>
                        </div>
                        
                        <div class="guide-section">
                            <h4>💡 Tips</h4>
                            <ul>
                                <li>Use notes to record your strategy thoughts</li>
                                <li>Export your plan to share or save for later</li>
                                <li>Compare best/worst case scenarios to assess risk</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Team Selection Modal -->
            <div id="team-select-modal" class="planner-modal" style="display: none;">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-content-sm">
                    <div class="modal-header">
                        <h3 id="team-select-title">Select Pokemon</h3>
                        <button class="modal-close" id="team-modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="team-select-grid" id="team-select-grid"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Append to body
        $('body').append(html);
        
        // Cache references
        $container = $('#battle-planner');
        $treePanel = $('.planner-tree-panel');
        $stagePanel = $('.planner-stage-panel');
        $inspectorPanel = $('.planner-inspector-panel');
    }
    
    /**
     * Setup event handlers
     */
    function setupEventHandlers() {
        // Open planner button (from main calc)
        $(document).on('click', '#open-battle-planner', function() {
            showPlanner();
        });
        
        // Keyboard shortcuts
        $(document).on('keydown', function(e) {
            if (e.key === 'p' && !$(e.target).is('input, textarea, select')) {
                e.preventDefault();
                togglePlanner();
            }
            if (e.key === 'Escape' && uiState.isVisible) {
                // Close modals first, then planner
                if ($('#planner-help-modal').is(':visible')) {
                    $('#planner-help-modal').hide();
                } else if ($('#team-select-modal').is(':visible')) {
                    $('#team-select-modal').hide();
                } else {
                    hidePlanner();
                }
            }
            if (uiState.isVisible && !$(e.target).is('input, textarea')) {
                if (e.key === 'ArrowLeft') {
                    navigateToPreviousTurn();
                }
                if (e.key === 'ArrowRight') {
                    navigateToNextTurn();
                }
            }
        });
        
        // View mode buttons
        $(document).on('click', '.planner-btn-view', function() {
            setViewMode($(this).data('view'));
        });
        
        // Close button
        $(document).on('click', '#planner-close', function() {
            hidePlanner();
        });
        
        // Help button
        $(document).on('click', '#planner-help', function() {
            $('#planner-help-modal').show();
        });
        $(document).on('click', '#help-modal-close, #planner-help-modal .modal-overlay', function() {
            $('#planner-help-modal').hide();
        });
        
        // Team modal close
        $(document).on('click', '#team-modal-close, #team-select-modal .modal-overlay', function() {
            $('#team-select-modal').hide();
        });
        
        // New battle button
        $(document).on('click', '#planner-new, #tree-start-battle', function() {
            startNewBattle();
        });
        
        // Start with imported team
        $(document).on('click', '#tree-start-imported', function() {
            startBattleWithImportedTeam();
        });
        
        // Import/Export
        $(document).on('click', '#planner-import', function() {
            importState();
        });
        $(document).on('click', '#planner-export', function() {
            exportPlan();
        });
        
        // Tree navigation
        $(document).on('click', '#tree-expand-all', expandAllNodes);
        $(document).on('click', '#tree-collapse-all', collapseAllNodes);
        
        $(document).on('click', '.tree-node', function(e) {
            e.stopPropagation();
            selectNode($(this).data('node-id'));
        });
        
        $(document).on('click', '.tree-node-toggle', function(e) {
            e.stopPropagation();
            toggleNodeExpand($(this).closest('.tree-node').data('node-id'));
        });
        
        // Move selection
        $(document).on('click', '.move-pill', function() {
            var moveIndex = $(this).data('move-index');
            var side = $(this).closest('.pokemon-card').hasClass('pokemon-card-p1') ? 'p1' : 'p2';
            calculateMoveOutcomes(side, moveIndex);
        });
        
        // Outcome branch click
        $(document).on('click', '.outcome-btn', function() {
            createBranchFromOutcome($(this).data('outcome-index'));
        });
        
        // Navigation
        $(document).on('click', '#stage-prev', navigateToPreviousTurn);
        $(document).on('click', '#stage-next', navigateToNextTurn);
        
        // Inspector
        $(document).on('click', '#inspector-collapse', toggleInspectorPanel);
        $(document).on('click', '#inspector-delete-node', deleteCurrentNode);
        $(document).on('change', '#inspector-notes', function() {
            updateNodeNotes($(this).val());
        });
        
        // Switch Pokemon buttons
        $(document).on('click', '#p1-switch-btn', function() {
            openTeamSelector('p1');
        });
        $(document).on('click', '#p2-switch-btn', function() {
            openTeamSelector('p2');
        });
        
        // Team slot click in panel
        $(document).on('click', '.team-slot', function() {
            var side = $(this).closest('.team-panel').hasClass('team-panel-p1') ? 'p1' : 'p2';
            var index = $(this).data('slot-index');
            switchToTeamMember(side, index);
        });
    }
    
    /**
     * Show the planner
     */
    function showPlanner() {
        uiState.isVisible = true;
        $container.fadeIn(300);
        $('body').addClass('planner-active');
    }
    
    /**
     * Hide the planner
     */
    function hidePlanner() {
        uiState.isVisible = false;
        $container.fadeOut(200);
        $('body').removeClass('planner-active');
    }
    
    function togglePlanner() {
        if (uiState.isVisible) {
            hidePlanner();
        } else {
            showPlanner();
        }
    }
    
    function setViewMode(mode) {
        uiState.viewMode = mode;
        $('.planner-btn-view').removeClass('active');
        $('.planner-btn-view[data-view="' + mode + '"]').addClass('active');
        $container.removeClass('view-split view-tree view-stage').addClass('view-' + mode);
    }
    
    /**
     * Start a new battle with current calculator state
     */
    function startNewBattle() {
        try {
            var p1Pokemon = window.createPokemon ? window.createPokemon($('#p1')) : null;
            var p2Pokemon = window.createPokemon ? window.createPokemon($('#p2')) : null;
            var field = window.createField ? window.createField() : null;
            
            if (!p1Pokemon || !p2Pokemon) {
                alert('Please set up both Pokemon in the calculator first.');
                return;
            }
            
            var initialState = CalcIntegration.createStateFromCalculator(p1Pokemon, p2Pokemon, field);
            
            uiState.tree.initialize(initialState);
            
            renderTree();
            renderStage();
            
            $('.tree-placeholder').hide();
            
            console.log('Battle started:', initialState);
        } catch (e) {
            console.error('Failed to start battle:', e);
            alert('Failed to start battle: ' + e.message);
        }
    }
    
    /**
     * Start battle with imported team
     */
    function startBattleWithImportedTeam() {
        var customsets = localStorage.customsets ? JSON.parse(localStorage.customsets) : {};
        var importedPokemon = [];
        
        // Collect imported Pokemon from customsets
        for (var name in customsets) {
            for (var setName in customsets[name]) {
                var set = customsets[name][setName];
                if (set && set.name) {
                    importedPokemon.push(set);
                }
            }
        }
        
        if (importedPokemon.length === 0) {
            alert('No imported Pokemon found. Please import a savefile first using the main calculator.');
            return;
        }
        
        try {
            var p2Pokemon = window.createPokemon ? window.createPokemon($('#p2')) : null;
            var field = window.createField ? window.createField() : null;
            
            var initialState = new BattlePlanner.BattleStateSnapshot();
            
            // Create P1 from first imported Pokemon
            var firstPoke = importedPokemon[0];
            initialState.p1.active = createSnapshotFromImported(firstPoke);
            
            // Store team
            initialState.p1.team = importedPokemon.slice(0, 6).map(function(p) {
                return createSnapshotFromImported(p);
            });
            
            // P2 from calculator
            if (p2Pokemon) {
                initialState.p2.active = new BattlePlanner.PokemonSnapshot(p2Pokemon);
            }
            
            // Field
            if (field) {
                initialState.field.weather = field.weather || 'None';
                initialState.field.terrain = field.terrain || 'None';
            }
            
            uiState.tree.initialize(initialState);
            
            renderTree();
            renderStage();
            
            $('.tree-placeholder').hide();
            
            console.log('Battle started with imported team:', importedPokemon.length, 'Pokemon');
        } catch (e) {
            console.error('Failed to start battle:', e);
            alert('Failed to start battle: ' + e.message);
        }
    }
    
    /**
     * Create a snapshot from imported Pokemon data
     */
    function createSnapshotFromImported(data) {
        var snapshot = new BattlePlanner.PokemonSnapshot(null);
        snapshot.name = data.name || '';
        snapshot.species = data.species || data.name || '';
        snapshot.level = data.level || 100;
        snapshot.ability = data.ability || '';
        snapshot.item = data.item || '';
        snapshot.nature = data.nature || 'Hardy';
        snapshot.moves = data.moves || [];
        snapshot.types = data.types || [];
        
        // EVs and IVs
        if (data.evs) {
            var statMap = { hp: 'hp', at: 'atk', df: 'def', sa: 'spa', sd: 'spd', sp: 'spe' };
            for (var key in data.evs) {
                var stat = statMap[key] || key;
                snapshot.evs[stat] = data.evs[key] || 0;
            }
        }
        if (data.ivs) {
            var statMap = { hp: 'hp', at: 'atk', df: 'def', sa: 'spa', sd: 'spd', sp: 'spe' };
            for (var key in data.ivs) {
                var stat = statMap[key] || key;
                snapshot.ivs[stat] = data.ivs[key] || 31;
            }
        }
        
        // Calculate HP
        if (window.pokedex && window.pokedex[snapshot.name]) {
            var baseStats = window.pokedex[snapshot.name].bs || {};
            var baseHP = baseStats.hp || 50;
            var level = snapshot.level;
            var iv = snapshot.ivs.hp || 31;
            var ev = snapshot.evs.hp || 0;
            snapshot.maxHP = Math.floor(((2 * baseHP + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
            snapshot.currentHP = snapshot.maxHP;
            snapshot.percentHP = 100;
            
            // Calculate other stats
            var statNames = ['atk', 'def', 'spa', 'spd', 'spe'];
            var natureMap = getNatureMultipliers(snapshot.nature);
            for (var i = 0; i < statNames.length; i++) {
                var stat = statNames[i];
                var legacyStat = { atk: 'at', def: 'df', spa: 'sa', spd: 'sd', spe: 'sp' }[stat];
                var baseStat = baseStats[legacyStat] || 50;
                var statIV = snapshot.ivs[stat] || 31;
                var statEV = snapshot.evs[stat] || 0;
                var natureMult = natureMap[stat] || 1;
                snapshot.stats[stat] = Math.floor((Math.floor(((2 * baseStat + statIV + Math.floor(statEV / 4)) * level) / 100) + 5) * natureMult);
            }
            snapshot.stats.hp = snapshot.maxHP;
        } else {
            snapshot.maxHP = 300;
            snapshot.currentHP = 300;
            snapshot.percentHP = 100;
        }
        
        return snapshot;
    }
    
    function getNatureMultipliers(nature) {
        var natures = {
            'Adamant': { atk: 1.1, spa: 0.9 },
            'Bold': { def: 1.1, atk: 0.9 },
            'Brave': { atk: 1.1, spe: 0.9 },
            'Calm': { spd: 1.1, atk: 0.9 },
            'Careful': { spd: 1.1, spa: 0.9 },
            'Gentle': { spd: 1.1, def: 0.9 },
            'Hasty': { spe: 1.1, def: 0.9 },
            'Impish': { def: 1.1, spa: 0.9 },
            'Jolly': { spe: 1.1, spa: 0.9 },
            'Lax': { def: 1.1, spd: 0.9 },
            'Lonely': { atk: 1.1, def: 0.9 },
            'Mild': { spa: 1.1, def: 0.9 },
            'Modest': { spa: 1.1, atk: 0.9 },
            'Naive': { spe: 1.1, spd: 0.9 },
            'Naughty': { atk: 1.1, spd: 0.9 },
            'Quiet': { spa: 1.1, spe: 0.9 },
            'Rash': { spa: 1.1, spd: 0.9 },
            'Relaxed': { def: 1.1, spe: 0.9 },
            'Sassy': { spd: 1.1, spe: 0.9 },
            'Timid': { spe: 1.1, atk: 0.9 }
        };
        return natures[nature] || {};
    }
    
    function importState() {
        var json = prompt('Paste exported battle plan JSON:');
        if (json) {
            try {
                if (uiState.tree.deserialize(json)) {
                    renderTree();
                    renderStage();
                    $('.tree-placeholder').hide();
                    alert('Battle plan imported successfully!');
                } else {
                    alert('Failed to import battle plan.');
                }
            } catch (e) {
                alert('Invalid JSON format.');
            }
        }
    }
    
    function exportPlan() {
        var json = uiState.tree.serialize();
        
        navigator.clipboard.writeText(json).then(function() {
            alert('Battle plan copied to clipboard!');
        }).catch(function() {
            var textarea = document.createElement('textarea');
            textarea.value = json;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            alert('Battle plan copied to clipboard!');
        });
    }
    
    /**
     * Render the tree visualization
     */
    function renderTree() {
        var $treeContent = $('#tree-container');
        
        if (!uiState.tree.rootId) {
            $treeContent.html($('.tree-placeholder').show());
            return;
        }
        
        var html = '<div class="tree-root">' + renderTreeNode(uiState.tree.rootId, 0) + '</div>';
        $treeContent.html(html);
    }
    
    function renderTreeNode(nodeId, depth) {
        var node = uiState.tree.getNode(nodeId);
        if (!node) return '';
        
        var isExpanded = uiState.expandedNodes[nodeId] !== false;
        var isCurrentNode = nodeId === uiState.tree.currentNodeId;
        var hasChildren = node.children.length > 0;
        
        var nodeClasses = ['tree-node'];
        if (isCurrentNode) nodeClasses.push('tree-node-current');
        if (node.isBestCase) nodeClasses.push('tree-node-best');
        if (node.isWorstCase) nodeClasses.push('tree-node-worst');
        
        var p1HP = node.state.p1.active ? node.state.p1.active.percentHP : 0;
        var p2HP = node.state.p2.active ? node.state.p2.active.percentHP : 0;
        
        var label = node.id === uiState.tree.rootId ? 'Start' : node.getFullLabel();
        var probText = '';
        if (node.outcome && node.outcome.probability < 1) {
            probText = CalcIntegration.formatProbability(node.outcome.probability);
        }
        
        var html = '<div class="' + nodeClasses.join(' ') + '" data-node-id="' + nodeId + '" style="margin-left: ' + (depth * 16) + 'px;">';
        html += '<div class="tree-node-content">';
        
        if (hasChildren) {
            html += '<span class="tree-node-toggle">' + (isExpanded ? '▼' : '▶') + '</span>';
        } else {
            html += '<span class="tree-node-toggle tree-node-leaf">○</span>';
        }
        
        html += '<span class="tree-node-label">' + label + '</span>';
        html += '<span class="tree-node-hp"><span class="hp-p1" style="width:' + p1HP + '%"></span><span class="hp-p2" style="width:' + p2HP + '%"></span></span>';
        
        if (probText) {
            html += '<span class="tree-node-prob">' + probText + '</span>';
        }
        
        html += '</div></div>';
        
        if (hasChildren && isExpanded) {
            node.children.forEach(function(childId) {
                html += renderTreeNode(childId, depth + 1);
            });
        }
        
        return html;
    }
    
    /**
     * Render the stage view
     */
    function renderStage() {
        var currentNode = uiState.tree.getCurrentNode();
        if (!currentNode) {
            $('#stage-turn-label').text('TURN 0');
            return;
        }
        
        var state = currentNode.state;
        
        $('#stage-turn-label').text('TURN ' + state.turnNumber);
        
        // Render Pokemon cards
        renderPokemonCard('p1', state.p1.active);
        renderPokemonCard('p2', state.p2.active);
        
        // Render speed comparison
        renderSpeedComparison(state);
        
        // Render team panels
        renderTeamPanel('p1', state.p1.team, state.p1.teamSlot);
        renderTeamPanel('p2', state.p2.team, state.p2.teamSlot);
        
        // Update inspector
        renderInspector(currentNode);
        
        // Clear probability cloud
        renderProbabilityCloud([]);
    }
    
    /**
     * Render a Pokemon card
     */
    function renderPokemonCard(side, pokemon) {
        var prefix = 'stage-' + side;
        
        if (!pokemon) {
            $('#' + prefix + '-name').text('---');
            $('#' + prefix + '-level').text('Lv. --');
            $('#' + prefix + '-hp-text').text('---/---');
            $('#' + prefix + '-hp-fill').css('width', '0%');
            $('#' + prefix + '-sprite').attr('src', '').hide();
            $('#' + prefix + '-moves').empty();
            $('#' + prefix + '-types').empty();
            $('#' + prefix + '-ability').empty();
            $('#' + prefix + '-item').empty();
            $('#' + prefix + '-status').empty();
            $('#' + prefix + '-boosts').empty();
            $('#' + prefix + '-stats-mini').empty();
            return;
        }
        
        // Name and level
        $('#' + prefix + '-name').text(pokemon.name);
        $('#' + prefix + '-level').text('Lv. ' + pokemon.level);
        
        // Ability
        if (pokemon.ability) {
            $('#' + prefix + '-ability').text(pokemon.ability).show();
        } else {
            $('#' + prefix + '-ability').empty().hide();
        }
        
        // HP
        var hpPercent = pokemon.percentHP;
        var hpColor = hpPercent > 50 ? 'hp-green' : hpPercent > 20 ? 'hp-yellow' : 'hp-red';
        $('#' + prefix + '-hp-text').text(pokemon.currentHP + '/' + pokemon.maxHP);
        $('#' + prefix + '-hp-fill')
            .removeClass('hp-green hp-yellow hp-red')
            .addClass(hpColor)
            .css('width', hpPercent + '%');
        
        // Sprite
        var spriteName = pokemon.name.toLowerCase().replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
        var spriteUrl = 'https://raw.githubusercontent.com/May8th1995/sprites/master/' + spriteName + '.png';
        $('#' + prefix + '-sprite')
            .attr('src', spriteUrl)
            .show()
            .on('error', function() {
                $(this).attr('src', 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/0.png');
            });
        
        // Types
        var typesHtml = (pokemon.types || []).map(function(t) {
            return '<span class="type-badge type-' + t.toLowerCase() + '">' + t + '</span>';
        }).join('');
        $('#' + prefix + '-types').html(typesHtml);
        
        // Status
        if (pokemon.status && pokemon.status !== 'Healthy') {
            var statusClass = 'status-' + pokemon.status.toLowerCase().replace(' ', '-');
            $('#' + prefix + '-status').html('<span class="status-badge ' + statusClass + '">' + pokemon.status + '</span>');
        } else {
            $('#' + prefix + '-status').empty();
        }
        
        // Item
        if (pokemon.item) {
            $('#' + prefix + '-item').html('<span class="item-badge">🎒 ' + pokemon.item + '</span>');
        } else {
            $('#' + prefix + '-item').empty();
        }
        
        // Boosts
        var boostsHtml = '';
        var statLabels = { atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
        for (var stat in statLabels) {
            if (pokemon.boosts[stat] && pokemon.boosts[stat] !== 0) {
                var val = pokemon.boosts[stat];
                var cls = val > 0 ? 'boost-up' : 'boost-down';
                boostsHtml += '<span class="boost-badge ' + cls + '">' + statLabels[stat] + (val > 0 ? '+' : '') + val + '</span>';
            }
        }
        $('#' + prefix + '-boosts').html(boostsHtml);
        
        // Mini stats
        var statsHtml = '<span class="stat-mini">Spe: ' + (pokemon.stats.spe || '?') + '</span>';
        $('#' + prefix + '-stats-mini').html(statsHtml);
        
        // Moves
        var movesHtml = (pokemon.moves || []).map(function(move, i) {
            var pp = pokemon.pp[i] !== undefined ? pokemon.pp[i] : '--';
            return '<button class="move-pill" data-move-index="' + i + '">' + 
                   '<span class="move-name">' + move + '</span>' +
                   '<span class="move-pp">(' + pp + ')</span>' +
                   '</button>';
        }).join('');
        $('#' + prefix + '-moves').html(movesHtml);
    }
    
    /**
     * Render speed comparison bar
     */
    function renderSpeedComparison(state) {
        var comparison = state.getSpeedComparison();
        var $text = $('#speed-text');
        
        if (comparison.speedTie) {
            $text.html('<span class="speed-tie">Speed Tie! (' + comparison.p1Speed + ')</span>');
        } else if (comparison.p1First) {
            var p1Name = state.p1.active ? state.p1.active.name : 'P1';
            $text.html('<span class="speed-p1">' + p1Name + ' moves first</span> <span class="speed-values">(' + comparison.p1Speed + ' vs ' + comparison.p2Speed + ')</span>');
        } else {
            var p2Name = state.p2.active ? state.p2.active.name : 'P2';
            $text.html('<span class="speed-p2">' + p2Name + ' moves first</span> <span class="speed-values">(' + comparison.p2Speed + ' vs ' + comparison.p1Speed + ')</span>');
        }
        
        if (state.field.trickRoom) {
            $text.append(' <span class="trick-room-badge">Trick Room!</span>');
        }
    }
    
    /**
     * Render team panel
     */
    function renderTeamPanel(side, team, activeSlot) {
        var $container = $('#team-slots-' + side);
        
        if (!team || team.length === 0) {
            $container.html('<div class="team-empty">No team loaded</div>');
            return;
        }
        
        var html = team.map(function(poke, i) {
            var isActive = i === activeSlot;
            var isFainted = poke.hasFainted;
            var classes = ['team-slot'];
            if (isActive) classes.push('team-slot-active');
            if (isFainted) classes.push('team-slot-fainted');
            
            var hpColor = poke.percentHP > 50 ? 'green' : poke.percentHP > 20 ? 'yellow' : 'red';
            
            return '<div class="' + classes.join(' ') + '" data-slot-index="' + i + '" title="' + poke.name + '">' +
                   '<div class="team-slot-name">' + (poke.name || '?').substring(0, 8) + '</div>' +
                   '<div class="team-slot-hp" style="width: ' + poke.percentHP + '%; background-color: ' + hpColor + '"></div>' +
                   '</div>';
        }).join('');
        
        $container.html(html);
    }
    
    /**
     * Render the probability cloud
     */
    function renderProbabilityCloud(outcomes) {
        var $cloud = $('#cloud-outcomes');
        
        if (!outcomes || outcomes.length === 0) {
            $cloud.html('<p class="cloud-empty">Select a move to see possible outcomes</p>');
            return;
        }
        
        var html = outcomes.map(function(outcome, i) {
            var probText = CalcIntegration.formatProbability(outcome.probability);
            var damageText = outcome.damageRange ? 
                outcome.damageRange.min + '-' + outcome.damageRange.max : 
                Math.round(outcome.damage);
            var percentText = outcome.damagePercent ? 
                '(' + outcome.damagePercent + '%)' : '';
            
            var classes = ['outcome-btn'];
            if (outcome.effects && outcome.effects.crit) classes.push('outcome-crit');
            if (outcome.effects && outcome.effects.miss) classes.push('outcome-miss');
            
            return '<button class="' + classes.join(' ') + '" data-outcome-index="' + i + '">' +
                   '<span class="outcome-label">' + outcome.label + '</span>' +
                   '<span class="outcome-prob">' + probText + '</span>' +
                   '<span class="outcome-damage">' + damageText + ' ' + percentText + '</span>' +
                   '</button>';
        }).join('');
        
        $cloud.html(html);
        uiState.currentOutcomes = outcomes;
    }
    
    /**
     * Render the inspector panel
     */
    function renderInspector(node) {
        if (!node) return;
        
        var state = node.state;
        var cumProb = uiState.tree.getCumulativeProbability(node.id);
        
        $('#inspector-turn').text(state.turnNumber);
        $('#inspector-probability').text(CalcIntegration.formatProbability(cumProb));
        $('#inspector-action').text(node.actions.p1 ? node.actions.p1.describe() : 'Initial State');
        
        // Field
        $('#inspector-weather').text(state.field.weather || 'None');
        $('#inspector-terrain').text(state.field.terrain || 'None');
        
        // Side effects
        renderSideEffects('p1', state.sides.p1);
        renderSideEffects('p2', state.sides.p2);
        
        // Notes
        $('#inspector-notes').val(node.notes || '');
    }
    
    function renderSideEffects(side, sideState) {
        var effects = [];
        
        if (sideState.stealthRock) effects.push('<span class="effect-tag effect-hazard">Stealth Rock</span>');
        if (sideState.spikes > 0) effects.push('<span class="effect-tag effect-hazard">Spikes ×' + sideState.spikes + '</span>');
        if (sideState.toxicSpikes > 0) effects.push('<span class="effect-tag effect-hazard">T-Spikes ×' + sideState.toxicSpikes + '</span>');
        if (sideState.stickyWeb) effects.push('<span class="effect-tag effect-hazard">Sticky Web</span>');
        if (sideState.reflect) effects.push('<span class="effect-tag effect-screen">Reflect</span>');
        if (sideState.lightScreen) effects.push('<span class="effect-tag effect-screen">Light Screen</span>');
        if (sideState.auroraVeil) effects.push('<span class="effect-tag effect-screen">Aurora Veil</span>');
        if (sideState.tailwind) effects.push('<span class="effect-tag effect-boost">Tailwind</span>');
        
        var html = effects.length > 0 ? effects.join('') : '<span class="no-effects">None</span>';
        $('#inspector-' + side + '-effects').html(html);
    }
    
    /**
     * Calculate outcomes for a move
     */
    function calculateMoveOutcomes(attackerSide, moveIndex) {
        var currentNode = uiState.tree.getCurrentNode();
        if (!currentNode) return;
        
        var state = currentNode.state;
        var attacker = attackerSide === 'p1' ? state.p1.active : state.p2.active;
        var defender = attackerSide === 'p1' ? state.p2.active : state.p1.active;
        
        if (!attacker || !defender) {
            console.warn('Missing attacker or defender');
            return;
        }
        
        var moveName = attacker.moves[moveIndex];
        if (!moveName || moveName === '(No Move)') return;
        
        try {
            // Get Pokemon objects for calculation
            var attackerPokemon = CalcIntegration.snapshotToPokemon(attacker, window.GENERATION);
            var defenderPokemon = CalcIntegration.snapshotToPokemon(defender, window.GENERATION);
            
            // Fallback to calculator if needed
            if (!attackerPokemon || !defenderPokemon) {
                attackerPokemon = window.createPokemon ? window.createPokemon($('#' + (attackerSide === 'p1' ? 'p1' : 'p2'))) : null;
                defenderPokemon = window.createPokemon ? window.createPokemon($('#' + (attackerSide === 'p1' ? 'p2' : 'p1'))) : null;
            }
            
            if (!attackerPokemon || !defenderPokemon) {
                renderProbabilityCloud([]);
                return;
            }
            
            // Create move
            var gen = window.GENERATION || window.gen || 8;
            var move = new window.calc.Move(gen, moveName);
            
            // Calculate outcomes
            var outcomes = CalcIntegration.calculateKeyOutcomes(
                attackerPokemon,
                defenderPokemon,
                move,
                window.createField ? window.createField() : null,
                window.GENERATION
            );
            
            // Add damage percentages
            outcomes.forEach(function(o) {
                if (o.damage > 0) {
                    o.damagePercent = Math.round((o.damage / defender.maxHP) * 100);
                }
            });
            
            // Store context
            uiState.selectedMove = {
                side: attackerSide,
                moveIndex: moveIndex,
                moveName: moveName,
                attacker: attackerPokemon,
                defender: defenderPokemon
            };
            
            renderProbabilityCloud(outcomes);
            
            // Show damage preview on HP bar
            if (outcomes.length > 0) {
                var avgDamage = outcomes.find(function(o) { return o.type === 'normal'; });
                if (avgDamage) {
                    showDamagePreview(attackerSide === 'p1' ? 'p2' : 'p1', avgDamage.damage, defender.maxHP);
                }
            }
            
            // Highlight selected move
            $('.pokemon-card-' + attackerSide + ' .move-pill').removeClass('selected');
            $('.pokemon-card-' + attackerSide + ' .move-pill[data-move-index="' + moveIndex + '"]').addClass('selected');
            
        } catch (e) {
            console.error('Failed to calculate outcomes:', e);
            renderProbabilityCloud([]);
        }
    }
    
    /**
     * Show damage preview on HP bar
     */
    function showDamagePreview(side, damage, maxHP) {
        var $shadow = $('#stage-' + side + '-hp-shadow');
        var currentPercent = parseFloat($('#stage-' + side + '-hp-fill').css('width')) / $('#stage-' + side + '-hp-fill').parent().width() * 100;
        var damagePercent = (damage / maxHP) * 100;
        var newPercent = Math.max(0, currentPercent - damagePercent);
        
        $shadow.css({
            'width': currentPercent + '%',
            'left': newPercent + '%',
            'opacity': 0.5
        });
    }
    
    /**
     * Create a branch from outcome
     */
    function createBranchFromOutcome(outcomeIndex) {
        var outcomes = uiState.currentOutcomes;
        var moveContext = uiState.selectedMove;
        
        if (!outcomes || !outcomes[outcomeIndex] || !moveContext) {
            return;
        }
        
        var outcome = outcomes[outcomeIndex];
        var currentNode = uiState.tree.getCurrentNode();
        if (!currentNode) return;
        
        // Create new state
        var newState = CalcIntegration.applyOutcomeToState(
            currentNode.state,
            outcome,
            moveContext.side,
            null
        );
        
        // Create action
        var action = {};
        action[moveContext.side] = new BattlePlanner.BattleAction('move', {
            moveName: moveContext.moveName,
            moveIndex: moveContext.moveIndex
        });
        
        // Create outcome
        var battleOutcome = new BattlePlanner.BattleOutcome(
            outcome.label,
            outcome.probability,
            outcome.damage,
            outcome.effects
        );
        
        // Add branch
        var newNode = uiState.tree.addBranch(currentNode.id, newState, action, battleOutcome);
        
        if (newNode) {
            uiState.tree.navigate(newNode.id);
        }
    }
    
    /**
     * Open team selector modal
     */
    function openTeamSelector(side) {
        var currentNode = uiState.tree.getCurrentNode();
        if (!currentNode) return;
        
        var team = side === 'p1' ? currentNode.state.p1.team : currentNode.state.p2.team;
        if (!team || team.length === 0) {
            alert('No team available. Load a team first.');
            return;
        }
        
        $('#team-select-title').text('Switch ' + (side === 'p1' ? 'Your' : "Opponent's") + ' Pokemon');
        
        var html = team.map(function(poke, i) {
            var isActive = (side === 'p1' ? currentNode.state.p1.teamSlot : currentNode.state.p2.teamSlot) === i;
            var classes = ['team-select-item'];
            if (isActive) classes.push('team-select-active');
            if (poke.hasFainted) classes.push('team-select-fainted');
            
            return '<div class="' + classes.join(' ') + '" data-side="' + side + '" data-index="' + i + '">' +
                   '<div class="team-select-name">' + poke.name + '</div>' +
                   '<div class="team-select-hp">' + poke.currentHP + '/' + poke.maxHP + ' HP</div>' +
                   '</div>';
        }).join('');
        
        $('#team-select-grid').html(html);
        $('#team-select-modal').show();
        
        // Bind click
        $('.team-select-item').off('click').on('click', function() {
            var clickedSide = $(this).data('side');
            var index = $(this).data('index');
            switchToTeamMember(clickedSide, index);
            $('#team-select-modal').hide();
        });
    }
    
    /**
     * Switch to a team member
     */
    function switchToTeamMember(side, index) {
        var currentNode = uiState.tree.getCurrentNode();
        if (!currentNode) return;
        
        var team = side === 'p1' ? currentNode.state.p1.team : currentNode.state.p2.team;
        if (!team || !team[index]) return;
        
        // Create new state with switch
        var newState = currentNode.state.clone();
        newState.turnNumber++;
        
        if (side === 'p1') {
            newState.p1.active = team[index].clone();
            newState.p1.teamSlot = index;
        } else {
            newState.p2.active = team[index].clone();
            newState.p2.teamSlot = index;
        }
        
        // Create action
        var action = {};
        action[side] = new BattlePlanner.BattleAction('switch', {
            switchTo: team[index].name,
            switchToIndex: index
        });
        
        // Add branch
        var newNode = uiState.tree.addBranch(
            currentNode.id,
            newState,
            action,
            new BattlePlanner.BattleOutcome('Switch', 1, 0, {})
        );
        
        if (newNode) {
            uiState.tree.navigate(newNode.id);
        }
    }
    
    function selectNode(nodeId) {
        uiState.tree.navigate(nodeId);
    }
    
    function toggleNodeExpand(nodeId) {
        uiState.expandedNodes[nodeId] = !uiState.expandedNodes[nodeId];
        renderTree();
    }
    
    function expandAllNodes() {
        Object.keys(uiState.tree.nodes).forEach(function(id) {
            uiState.expandedNodes[id] = true;
        });
        renderTree();
    }
    
    function collapseAllNodes() {
        Object.keys(uiState.tree.nodes).forEach(function(id) {
            uiState.expandedNodes[id] = false;
        });
        if (uiState.tree.rootId) {
            uiState.expandedNodes[uiState.tree.rootId] = true;
        }
        renderTree();
    }
    
    function navigateToPreviousTurn() {
        var currentNode = uiState.tree.getCurrentNode();
        if (currentNode && currentNode.parentId) {
            uiState.tree.navigate(currentNode.parentId);
        }
    }
    
    function navigateToNextTurn() {
        var currentNode = uiState.tree.getCurrentNode();
        if (currentNode && currentNode.children.length > 0) {
            uiState.tree.navigate(currentNode.children[0]);
        }
    }
    
    function toggleInspectorPanel() {
        $inspectorPanel.toggleClass('collapsed');
        $('#inspector-collapse').text($inspectorPanel.hasClass('collapsed') ? '▶' : '◀');
    }
    
    function deleteCurrentNode() {
        var currentNode = uiState.tree.getCurrentNode();
        if (!currentNode || currentNode.id === uiState.tree.rootId) {
            alert('Cannot delete the root node');
            return;
        }
        
        if (confirm('Delete this branch and all its children?')) {
            uiState.tree.removeNode(currentNode.id);
        }
    }
    
    function updateNodeNotes(notes) {
        var currentNode = uiState.tree.getCurrentNode();
        if (currentNode) {
            currentNode.notes = notes;
        }
    }
    
    function onTreeUpdated() {
        renderTree();
        uiState.tree.analyzeOutcomes();
    }
    
    function onCurrentNodeChanged(data) {
        renderTree();
        renderStage();
        
        // Ensure current node is visible
        var path = uiState.tree.getPathToNode(data.newNodeId);
        path.forEach(function(id) {
            uiState.expandedNodes[id] = true;
        });
        renderTree();
        
        setTimeout(function() {
            var node = $('.tree-node[data-node-id="' + data.newNodeId + '"]')[0];
            if (node) {
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
    
    // Initialize on ready
    $(document).ready(function() {
        initialize();
    });
    
    // Export
    window.BattlePlannerUI = {
        show: showPlanner,
        hide: hidePlanner,
        toggle: togglePlanner,
        startBattle: startNewBattle,
        startWithImportedTeam: startBattleWithImportedTeam,
        getTree: function() { return uiState.tree; },
        isVisible: function() { return uiState.isVisible; }
    };
    
})(window, jQuery);
