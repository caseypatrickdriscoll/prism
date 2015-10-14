var PrismTree = React.createClass( {

	getInitialState: function() {

		var state = { 
			branches        : {},
			active          : { branch : null },
			lockMetaPanel   : PRISM.lockMetaPanel,
			isMetaPanelOpen : false
		};

		return state;
	},

	/**
	 * Returns true if the value of this.state.active.branch is not null
	 *    and if that value is a key in this.state.branches
	 * 
	 * @return {Boolean} The status of the active branch
	 */
	hasActiveBranch: function() {

		var hasActiveBranch = false;

		if ( this.state.active.branch !== null && this.state.active.branch in this.state.branches )
			hasActiveBranch = true;

		return hasActiveBranch;

	},

	/**
	 * Returns true if there is an active branch in state,
	 *    there is an active leaf in that branch
	 *    and pertinent active leaf data in state
	 *    
	 * @return {Boolean} The status of the active leaf
	 */
	hasActiveLeaf: function() {

		var hasActiveLeaf = false;

		if ( this.hasActiveBranch() ) {

			var activeBranch = this.state.branches[this.state.active.branch];

			if ( 'leaf' in activeBranch && activeBranch.leaf in activeBranch.leaves )
				hasActiveLeaf = true;

		}

		return hasActiveLeaf;

	},

	/**
	 * The PrismLeafMetaPanel in PrismLeaf is open on two conditions:
	 *     The global state is 'locked' open for all leaves
	 *     The local state is 'open' for that particular leaf
	 *
	 * This condition is checked on toggleMetaPanel and lockMetaPanel
	 *
	 * This needed to be attached to state because it wasn't updating otherwise.
	 * 
	 * @return {Boolean} [description]
	 */
	isMetaPanelOpen: function() {

		var state     = this.state;

		var isMetaPanelOpen = false;

		var branch    = state.active.branch;
		var leaf      = state.branches[branch].leaf;

		if ( state.lockMetaPanel == 'lock' || state.branches[branch].leaves[leaf].metapanel == 'open' )
			isMetaPanelOpen = true;

		return isMetaPanelOpen;
	},

	changeLeaf: function(e) {
		e.preventDefault();

		var state = this.state;

		state.branches[state.active.branch].leaf = jQuery( e.nativeEvent.target ).data( 'id' );

		state.isMetaPanelOpen = this.isMetaPanelOpen();

		this.setState( state );
	},

	changeBranch: function(e) {
		e.preventDefault();

		jQuery( '#prism-menu a' ).removeClass( 'active' );

		e.nativeEvent.target.classList.toggle( 'active' );

		var state = this.state;

		state.active.branch = jQuery( e.nativeEvent.target ).data( 'slug' );

		this.setState( state );

		this.loadLeaves();
	},

	changeBranchView : function(e) {
		e.preventDefault();

		var view = jQuery( e.nativeEvent.target ).data( 'view' );

		var state = this.state;

		if ( view == state.branches[state.active.branch].view ) return;

		jQuery( '#prism-branch-visual-controls i' ).removeClass( 'active' );

		state.branches[state.active.branch].view = view;

		this.setState( state );
	},

	toggleMetaPanel : function(e) {
		e.preventDefault();

		var state     = this.state;

		var branch    = state.active.branch;
		var leaf      = state.branches[branch].leaf;

		if ( state.branches[branch].leaves[leaf].metapanel == 'open' )
			state.branches[branch].leaves[leaf].metapanel = 'closed';
		else
			state.branches[branch].leaves[leaf].metapanel = 'open';

		state.isMetaPanelOpen = this.isMetaPanelOpen();

		this.setState( state );
	},

	lockMetaPanel : function(e) {
		e.preventDefault();

		var state     = this.state;

		var branch    = state.active.branch;
		var leaf      = state.branches[branch].leaf;

		if ( state.lockMetaPanel == 'unlock' )
			state.lockMetaPanel = 'lock';
		else
			state.lockMetaPanel = 'unlock';

		this.setState( state );
	},

	addLeaf: function() {
		var state = this.state;
		var active = this.state.active;

		state.branches[active.branch].leaves['new'] = { 
			id : 'new',
			date : new Date().toISOString().slice(0, 19),
			content : {
				rendered : '',
			},
			title : {
				rendered : 'new'
			}
		};

		this.setState( state );
	},

	loadLeaves: function() {

		// TODO: This is a temporary stop gap. Don't fetch the query if we already have them.
		// Ultimately, we'll have to check for changes and all that.
		if ( this.state.active.branch in this.state.branches ) return;

		jQuery.ajax( {
			method  : 'GET',
			url     : PRISM.url.rest + this.state.active.branch + '?filter[posts_per_page]=-1',
			success : function( response ) {

				var state = this.state;

				var leaves = {};

				for ( var i = 0; i < response.length; i++ ) {
					var leaf = response[i];

					leaf.metapanel = 'closed';

					leaves[leaf.id] = leaf;
				}

				state.branches[this.state.active.branch] = { leaves: leaves, view: PRISM.view };

				this.setState( state );

			}.bind( this )
		} );

	},

	branchData: function() {

		var branchData = { leaves : [] };

		if ( this.hasActiveBranch() ) {

			var branch = this.state.active.branch;

			branchData = {
				title : branch,
				view  : this.state.branches[branch].view,
				leaf  : this.state.branches[branch].leaf,
				leaves: this.state.branches[branch].leaves
			}

		}

		return branchData;
	},

	leafData: function() {

		var leafData = {};

		var branch = this.state.active.branch;

		if ( this.hasActiveBranch() ) {

			branch = this.state.branches[branch];

			if ( this.hasActiveLeaf() )
				leafData = branch.leaves[branch.leaf];
		}

		leafData.lockMetaPanel   = this.state.lockMetaPanel;
		leafData.isMetaPanelOpen = this.state.isMetaPanelOpen;

		return leafData;
	},

	/**
	 * Render the entire PrismTree, which includes the PrismTrunk, PrismBranch and PrismLeaf columns.
	 *
	 * There should be minimal logic in this function. Most conditionals should be in Object functions
	 *
	 * It will ways render the PrismTrunk.
	 *
	 * It will render the PrismBranch on condition that there is an active branch 
	 *    and that the given branch data exists in state (hasActiveBranch)
	 *
	 * It will render the PrismLeaf on condition that there is an active leaf for the given branch
	 *    and that the given leaf data exists in state (hasActiveLeaf)
	 * 
	 */
	render: function() {

		var auth = this.props.data.authenticated;

		var prismTrunkFunctions  = {
			changeBranch : this.changeBranch
		};

		var prismBranchFunctions = {
			changeLeaf : this.changeLeaf,
			changeView : this.changeBranchView,
			addLeaf    : this.addLeaf
		};

		var prismLeafFunctions   = {
			lockMetaPanel   : this.lockMetaPanel,
			toggleMetaPanel : this.toggleMetaPanel
		}

		var prismTrunk   = <PrismTrunk  functions={prismTrunkFunctions}  auth={auth} />
		var prismBranch  = <PrismBranch functions={prismBranchFunctions} auth={auth} data={this.branchData()} />;
		var prismLeaf    = <PrismLeaf   functions={prismLeafFunctions}   auth={auth} data={this.leafData()}   />;

		var renderTrunk  = prismTrunk; // For code consistency
		var renderBranch = this.hasActiveBranch() ? prismBranch : null;
		var renderLeaf   = this.hasActiveLeaf()   ? prismLeaf   : null;

		return (

			<div id="prism-tree">
				{renderTrunk}
				{renderBranch}
				{renderLeaf}
			</div>

		);
	}

} );