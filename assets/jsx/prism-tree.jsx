var PrismTree = React.createClass( {

	getInitialState: function() {

		log( 11, 'beg PrismTree.getInitialState()' );

		var state = { 
			branches         : {},
			ajax             : {
				status  : 'done',
				queue   : []
			},
			active           : { 
				branch  : null,
				leaf    : null,
				meta    : false,
				nested  : null
			},
			search           : {
				last    : null,
				query   : ''
			},
			lockMeta         : PRISM.lockMeta,
			currentlyChanged : false,
			width            : PRISM.width
		};

		log( 12, 'end PrismTree.getInitialState()' );

		return state;
	},

	componentWillMount: function() {

		log( 11, 'beg PrismTree.componentWillMount()' );

		var func = this.props.func;

		PrismKeyHandler = ( changeState ) => {

			if ( 'view'       in changeState )
				this.changeView( changeState.view );

			if ( 'move'       in changeState )
				this.move( changeState.move );

			if ( 'lockMeta'   in changeState )
				this.lockMeta();

			if ( 'changeMeta' in changeState )
				this.changeMeta();

			if ( 'addLeaf'    in changeState )
				this.addLeaf();

			if ( 'rainbow'    in changeState )
				func.toggleRainbow();

			if ( 'user'    in changeState )
				func.toggleUser();

		};

		this.initRouter();

		log( 12, 'end PrismTree.componentWillMount()' );

	},

	componentDidMount: function() {

		log( 11, 'beg PrismTree.componentDidMount()' );

		var state = this.state;

		if ( state.ajax.queue.length > 0 && state.ajax.status == 'done' )
			this.getData( state.ajax.queue[0] );

		this.setState;

		log( 12, 'end PrismTree.componentDidMount()' );

	},

	componentDidUpdate: function() {

		log( 11, 'beg PrismTree.componentDidUpdate()' );

		var state = this.state;

		if ( state.ajax.queue.length > 0 && state.ajax.status == 'done' )
			this.getData( state.ajax.queue[0] );

		this.setState;

		log( 12, 'end PrismTree.componentDidUpdate()' );

	},

	move: function( direction ) {

		log( 11, 'beg PrismTree.move()' );

		if ( this.hasActiveLeaf() ) {
			var leaf   = this.state.active.leaf;
			var branch = this.state.active.branch;

			var view   = this.state.branches[branch].view;

			var id     = branch + '/' + leaf;

			var next;

			var k = 0;
			var e = document.getElementById( id );
			while (e = e.previousSibling) { ++k;}

			if ( view == 'grid' ) {

				if ( direction == 'left' && k % 4 != 0 ) 
					next = document.getElementById( id ).previousSibling;
				else if ( direction == 'down' ) {
					next = document.getElementById( id ).nextSibling;
					if ( next != null ) next = next.nextSibling;
					if ( next != null ) next = next.nextSibling;
					if ( next != null ) next = next.nextSibling; 
				} else if ( direction == 'up' ) {
					next = document.getElementById( id ).previousSibling;
					if ( next != null ) next = next.previousSibling;
					if ( next != null ) next = next.previousSibling;
					if ( next != null ) next = next.previousSibling;
				} else if ( direction == 'right' && k % 4 != 3 )
					next = document.getElementById( id ).nextSibling;

			} else if ( view == 'half' ) {

				if ( direction == 'left' && k % 2 != 0 ) 
					next = document.getElementById( id ).previousSibling;
				else if ( direction == 'down' ) {
					next = document.getElementById( id ).nextSibling;
					if ( next != null ) next = next.nextSibling;
				} else if ( direction == 'up' ) {
					next = document.getElementById( id ).previousSibling;
					if ( next != null ) next = next.previousSibling;
				} else if ( direction == 'right' && k % 2 != 1 )
					next = document.getElementById( id ).nextSibling;

			} else {

				if ( direction == 'up' ) 
					next = document.getElementById( id ).previousSibling;
				else if ( direction == 'down' )
					next = document.getElementById( id ).nextSibling;

			}


			if ( next != null ) window.location = '/#/' + next.id;

		}

		log( 12, 'end PrismTree.move()' );
	},

	initRouter: function() {

		log( 11, 'beg PrismTree.initRouter()' );

		var routes = {};
		var routerConfig = {};

		PRISM.branches.map( function( branch, i ) {

			var nameSingle = branch.slug.single;
			var namePlural = branch.slug.plural;

			log( namePlural );

			routes[namePlural] = namePlural;

			var method = "get_" + nameSingle + "_by_id";

			routes[nameSingle + "/:id"] = method;

			branch.connections.map( function( nestedBranch, i ) {

				var nestedSingle;
				var nestedPlural;

				// TODO: Currently cycles through whole map, convert to 'some' or use for/break?
				PRISM.branches.map( function( b, i ) {
					if ( b.slug.plural == nestedBranch ) {
						nestedSingle = b.slug.single;
						nestedPlural = b.slug.plural;
					}
				} );

				var nestedBranchMethod = "get_" + nestedBranch + "_of_" + nameSingle;

				routes[nameSingle + "/:id/" + nestedBranch] = nestedBranchMethod;
				routerConfig[nestedBranchMethod] = function( id ) { 
				                                     this.changeNestedBranch( namePlural, id, nestedBranch );
				                                   }.bind( this );


				var nestedLeafMethod = "get_" + nestedSingle + "_of_" + namePlural + "_by_id";

				routes[nameSingle + "/:id/" + nestedSingle + "/:nested_id"] = nestedLeafMethod;
				routerConfig[nestedLeafMethod]   = function( id, nested_id ) { 
				                                     this.changeNestedLeaf( namePlural, id, nestedBranch, nested_id );
				                                   }.bind( this );

			}, this );

			routerConfig[namePlural] = function()   { this.changeBranch( namePlural )   }.bind( this );
			routerConfig[method]     = function(id) { this.changeLeaf( namePlural, id) }.bind( this );

		}, this );

		routes.search       = 'search';
		routerConfig.search = function() { this.changeSearch() }.bind( this );

		routerConfig.routes = routes;

		log( routes );

		var Router = Backbone.Router.extend( routerConfig );

		new Router();
		Backbone.history.start();

		log( 12, 'end PrismTree.initRouter()' );
	},

	/**
	 * Returns true if the value of this.state.active.branch is not null
	 *    and if that value is a key in this.state.branches
	 * 
	 * @return {Boolean} The status of the active branch
	 */
	hasActiveBranch: function() {

		log( 1, '------beg PrismTree.hasActiveBranch()' );

		var hasActiveBranch = false;

		if ( this.state.active.branch !== null && this.state.active.branch in this.state.branches )
			hasActiveBranch = true;

		log( 2, '------end PrismTree.hasActiveBranch() ' + hasActiveBranch );

		return hasActiveBranch;

	},

	hasNestedBranch: function() {

		log( 1, '------beg PrismTree.hasNestedBranch()' );

		var hasNestedBranch = false;

		if ( this.state.active.nested !== null && this.state.active.nested.route in this.state.branches )
			hasNestedBranch = true;

		log( 2, '------end PrismTree.hasNestedBranch() ' + hasNestedBranch );

		return hasNestedBranch;

	},

	/**
	 * Returns true if there is an active branch in state,
	 *    there is an active leaf in that branch
	 *    and pertinent active leaf data in state
	 *    
	 * @return {Boolean} The status of the active leaf
	 */
	hasActiveLeaf: function() {

		log( 1, '------beg PrismTree.hasActiveLeaf()' );

		var hasActiveLeaf = false;

		if ( this.hasActiveBranch() ) {

			var activeBranch = this.state.branches[this.state.active.branch];

			if ( this.state.active.leaf !== null && this.state.active.leaf in activeBranch.leaves )
				hasActiveLeaf = true;

		}

		log( 2, '------end PrismTree.hasActiveLeaf() ' + hasActiveLeaf );

		return hasActiveLeaf;

	},

	hasNestedLeaf: function() {

		log( 1, '------beg PrismTree.hasNestedLeaf()' );

		var hasNestedLeaf = false;

		if ( this.hasNestedBranch() ) {

			var nested = this.state.active.nested;

			// log( nested );

			if ( nested != null && this.state.active.leaf in this.state.branches[nested.route].leaves )
				hasNestedLeaf = true;

		}

		log( 2, '------end PrismTree.hasNestedLeaf(): ' + hasNestedLeaf );

		return hasNestedLeaf;

	},

	/**
	 * The PrismLeafMeta is open on two conditions:
	 *     The global state is 'locked' open for all leaves
	 *     The local state is 'open' for that particular leaf
	 *
	 * This condition is checked on toggleMeta and lockMeta
	 *
	 * This needed to be attached to state because it wasn't updating otherwise.
	 * 
	 * @return {Boolean} [description]
	 */
	hasActiveMeta: function() {

		log( 1, '------beg PrismTree.hasActiveMeta()' );

		var state  = this.state;

		var branch = state.active.branch;
		var leaf   = state.active.leaf;

		var meta   = false;

		if ( this.hasActiveLeaf() ) {
			if ( state.lockMeta == 'lock' || state.branches[branch].leaves[leaf].metapanel == 'open' )
				meta = true;
		}

		log( 2, '------end PrismTree.hasActiveMeta()' );

		return meta;
	},

	changeStatus: function( status ) {

		log( 11, 'beg PrismTree.changeStatus()' );

		this.props.func.changeStatus( status );

		log( 12, 'end PrismTree.changeStatus()' );

	},

	/**
	 * Previously, changeBranch was manually called from the PrismTrunk branch links.
	 *
	 * Now, with Backbone.js routing, changeBranch is only called from the route controller.
	 * 
	 * @param  {[type]} branch [description]
	 * @return {[type]}        [description]
	 */
	changeBranch: function( branch ) {

		log( 11, 'beg PrismTree.changeBranch()' );

		var state = this.state;

		state.active.branch = branch;
		state.active.nested = null;

		if ( ! ( branch in state.branches ) ) {
			state.branches[branch] = { leaves : {} };
			this.loadBranch( branch );
		}

		this.setState( state );

		log( 12, 'end PrismTree.changeBranch()' );

	},

	changeLeaf: function( branch, leaf ) {

		log( 11, 'beg PrismTree.changeLeaf()' );

		var state = this.state;

		state.active.branch = branch;
		state.active.leaf   = leaf;
		state.active.meta   = this.hasActiveMeta();
		state.active.nested = null;

		if ( ! ( branch in state.branches ) ) {
			state.branches[branch] = { leaves : {} };
			this.loadBranch( branch );
		}

		this.setState( state );

		log( 12, 'end PrismTree.changeLeaf()' );

	},

	/**
	 * A nested resource will have its own specialized branch.
	 *
	 * Previously, I was relying on general branches, and trying to retrieve a subset of those.
	 *
	 * For example, if I wanted the 'actors' in 'movie 4', 
	 *   I would look in branch 'movies' leaf '4',
	 *   but that would need to assume that the 'movies' branch is there.
	 *
	 * The branch should be simple and just reflect the state of that current data.
	 *
	 * If I want the actors of the movie, I should have a special branch stored in state.
	 *
	 * Thus, the url 'movies/4/actors' will have a special branch stored in state called movies_4_actors
	 *
	 * this.loadBranch should then be able to do a API call and get that branch's specific data.
	 *
	 * However, the GUI will reflect this in reverse as "Actors in Movies 4",
	 *   with the main 'Actors' menu link activated (with a UI change to add 'in movies 4' )
	 *
	 * But that rendering should be handled with the 'active.nested' conditional.
	 */
	changeNestedBranch: function( branch, leaf, nestedBranch ) {
		log( 11, 'beg PrismTree.changeNestedBranch()' );

		var state = this.state;

		var route = branch + '/' + leaf + '/' + nestedBranch;

		state.active.branch = nestedBranch;
		state.active.leaf   = null;
		state.active.meta   = this.hasActiveMeta();
		state.active.nested = { branch : branch, leaf : leaf, route : route };

		if ( ! ( route in state.branches ) ) {
			state.branches[route] = { leaves : {} };
			this.loadNestedBranch( branch, leaf, nestedBranch, route );
		}

		this.setState( state );

		log( 12, 'end PrismTree.changeNestedBranch()' );
	},

	changeNestedLeaf: function( branch, leaf, nestedBranch, nestedLeaf ) {
		log( 11, 'beg PrismTree.changeNestedLeaf()' );

		var state = this.state;

		var route = branch + '/' + leaf + '/' + nestedBranch;

		state.active.branch = nestedBranch;
		state.active.leaf   = nestedLeaf;
		state.active.meta   = this.hasActiveMeta();
		state.active.nested = { branch : branch, leaf : leaf, route : route };

		if ( ! ( route in state.branches ) ) {
			state.branches[route] = { leaves : {} };
			this.loadNestedBranch( branch, leaf, nestedBranch, route );
		}

		this.setState( state );

		log( 12, 'end PrismTree.changeNestedLeaf()' );
	},

	/**
	 * A special case for dealing with search
	 * @param  {[type]} branch [description]
	 * @param  {[type]} leaf   [description]
	 * @return {[type]}        [description]
	 */
	changeSearch: function() {

		log( 11, 'beg PrismTree.changeSearch()' );

		var state  = this.state;
		var branch = 'search';

		state.active.branch = branch;
		state.search.last   = state.search.query;
		state.search.query  = window.location.hash.slice( '#/search?query'.length + 1 );

		if ( ! ( branch in state.branches ) )
			state.branches[branch] = { leaves : {} };

		this.setState( state );

		if ( state.search.query != '' )
			this.loadSearch();

		log( 12, 'end PrismTree.changeSearch()' );

	},

	changeMeta : function() {

		log( 11, 'beg PrismTree.changeMeta()' );

		var state     = this.state;

		if ( state.lockMeta == 'lock' ) return;

		var branch    = state.active.branch;
		var leaf      = state.active.leaf;

		if ( state.branches[branch].leaves[leaf].metapanel == 'open' )
			state.branches[branch].leaves[leaf].metapanel = 'closed';
		else
			state.branches[branch].leaves[leaf].metapanel = 'open';

		state.active.meta = this.hasActiveMeta();

		this.setState( state );

		log( 12, 'end PrismTree.changeMeta()' );
	},

	lockMeta : function() {

		log( 11, 'beg PrismTree.lockMeta()' );

		var state  = this.state;

		if ( state.lockMeta == 'unlock' )
			state.lockMeta = 'lock';
		else
			state.lockMeta = 'unlock';

		state.active.meta = this.hasActiveMeta();

		this.setState( state );

		log( 12, 'end PrismTree.lockMeta()' );

	},

	changeValue : function(e) {

		log( 11, 'beg PrismTree.changeValue()' );

		var state  = this.state;

		var branch = state.branches[state.active.branch];
		var leaf   = state.active.leaf;
		var key    = e.target.dataset.key;

		if ( key == 'title' || key == 'content' )
			branch.leaves[leaf][key].rendered = e.target.value;
		else
			branch.leaves[leaf][key] = e.target.value;

		state.currentlyChanged = true;

		this.setState( state );

		log( 12, 'end PrismTree.changeValue()' );

	},

	changeWidth : function(e) {

		log( 11, 'beg PrismTree.changeWidth()' );

		if ( e.clientX == 0 ) return;

		var state      = this.state;

		var section    = {
			name : e.target.parentElement.dataset.section,
			left : e.target.parentElement.offsetLeft
		};

		var position   = e.clientX - section.left;

		// This could be more granular (currently at full percents), 
		// but there is a rendering jump at smaller decimals
		section.width  = parseInt( position / window.innerWidth * 100 );

		// The sibling to the parent
		var partner    = {};

		if ( section.name == 'trunk'  ) partner.name = 'branch';
		if ( section.name == 'branch' ) partner.name = 'leaf';
		if ( section.name == 'leaf'   ) partner.name = 'meta';

		var totalWidth = state.width.current[section.name] + state.width.current[partner.name];

		partner.width  = totalWidth - section.width;

		if ( section.width == state.width.current[section.name] ) return;

		if ( section.width < state.width.minimum[section.name] || section.width > state.width.maximum[section.name] ) return;
		if ( partner.width < state.width.minimum[partner.name] || partner.width > state.width.maximum[partner.name] ) return;

		state.width.current[section.name] = section.width;
		state.width.current[partner.name] = partner.width;

		this.setState( state );

		log( 12, 'end PrismTree.changeWidth()' );

	},

	changeView : function( view ) {

		log( 11, 'beg PrismTree.changeView()' );

		var state = this.state;

		if ( view == state.branches[state.active.branch].view ) return;

		state.branches[state.active.branch].view = view;

		this.setState( state );

		log( 12, 'end PrismTree.changeView()' );

	},

	resetWidth : function(e) {

		log( 11, 'beg PrismTree.resetWidth()' );

		var state      = this.state;

		state.width.current.trunk  = state.width.default.trunk;
		state.width.current.branch = state.width.default.branch;
		state.width.current.leaf   = state.width.default.leaf;

		this.setState( state );

		log( 12, 'end PrismTree.changeView()' );

	},

	addLeaf: function() {

		log( 11, 'beg PrismTree.addLeaf()' );

		var data = { 
			title   : '',
			content : ' ',
			date    : new Date().toISOString().slice(0, 19)
		};

		this.saveLeaf( 'create', data );

		log( 12, 'end PrismTree.addLeaf()' );

	},

	/**
	 * This function creates a new leaf through this.addLeaf     (create type)
	 *   or updates and existing leaf through PrismLeaf.prepLeaf (update type)
	 *
	 * TODO: The url should not rely on this.state.active.branch,
	 *   cause maybe the user can switch it real fast
	 */
	saveLeaf : function( type, data ) {

		log( 11, 'beg PrismTree.saveLeaf()' );

		var url = PRISM.url.rest + this.state.active.branch;

		if ( type == 'create' ) PRISM.newleaf = true;

		if ( type == 'update' ) url += '/' + data.id;

		jQuery.ajax( {
			method  : 'POST',
			url     : url,
			data    : data,
			beforeSend: function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', PRISM.nonce );
			},
			success : function( response ) {

				var state  = this.state;

				var leaf   = response;
				var branch = state.branches[state.active.branch];

				leaf.metapanel = 'closed';

				state.active.leaf = leaf.id;
				branch.leaves[leaf.id] = leaf;

				state.currentlyChanged = false;

				if ( PRISM.newleaf )
					location.hash = "/" + this.state.active.branch + "/" + leaf.id;

				this.setState( state );

			}.bind( this ),
			error : function( response ) {
				console.log( 'error: ', response );
			}.bind( this )
		} );

		log( 12, 'end PrismTree.saveLeaf()' );

	},

	loadBranch: function( branch ) {

		log( 11, 'beg PrismTree.loadBranch()' );

		var params = '?filter[posts_per_page]=-1';

		var request = {
			url      : PRISM.url.rest + branch + params,
			callback : this.unloadBranch,
			branch   : branch,
			status   : { type : 'loading', message : 'Loading ' + branch + ' data...' }
		}

		this.queueAJAX( request );

		log( 12, 'end PrismTree.loadBranch()' );

	},

	loadSearch: function() {

		log( 11, 'beg PrismTree.loadSearch()' );

		var state = this.state;

		var params  = '?filter[posts_per_page]=-1';
		    params += '&filter[s]=' + state.search.query;

		var request = {
			url      : PRISM.url.rest + 'posts' + params,
			callback : this.unloadBranch,
			branch   : 'search',
			status   : { type : 'loading', message : 'Searching for "' + state.search.query + '" data!' }
		}

		this.queueAJAX( request );

		log( 12, 'end PrismTree.loadBranch()' );

	},

	loadNestedBranch: function( branch, leaf, nestedBranch, route ) {

		log( 11, 'beg PrismTree.loadNestedBranch()' );

		var state = this.state;

		var params  = '?filter[posts_per_page]=-1';
		    params += '&filter[connected_type]=' + branch + '_to_' + nestedBranch;
		    params += '&filter[connected_id]='   + leaf;

		var request = {
			url      : PRISM.url.rest + branch + params,
			callback : this.unloadBranch,
			branch   : route,
			status   : { type : 'loading', message : 'Searching for ' + nestedBranch + ' data!' }
		}

		this.queueAJAX( request );

		log( 12, 'end PrismTree.loadNestedBranch()' );

	},

	unloadBranch: function( request, response ) {

		log( 11, 'beg PrismTree.unloadBranch()' );

		var state  = this.state;

		var leaves = {};

		for ( var i = 0; i < response.length; i++ ) {
			var leaf = response[i];

			leaf.metapanel = this.state.active.meta ? 'open' : 'closed';

			leaves[leaf.id] = leaf;
		}

		state.branches[request.branch] = { leaves: leaves };

		if ( request.branch in PRISM.view )
			state.branches[request.branch].view = PRISM.view[request.branch];
		else
			state.branches[request.branch].view = PRISM.view.default;

		this.changeStatus( { type: 'success', message: 'Successfully loaded ' + request.branch + ' data!' } );
		this.changeStatus( { type: 'normal',  message: null } );

		this.setState( state );

		log( 12, 'end PrismTree.unloadBranch()' );
	},

	queueAJAX: function( request ) {
		log( 11, 'beg PrismTree.queueAJAX()' );

		var state = this.state;

		if ( state.ajax.status == 'done' ) {
			state.ajax.queue.push( request );
			this.setState( state );
		} else {
			PRISM.ajax.queue.push( request );
		}


		log( 12, 'end PrismTree.queueAJAX()' );
	},

	dequeueAJAX: function( response ) {
		log( 11, 'beg PrismTree.dequeueAJAX()' );

		var state   = this.state;

		var request = state.ajax.queue.shift();

		state.ajax.status = 'done';

		request.callback( request, response );

		// TODO: GREAT WORKAROUND OR UGLIEST WORKAROUND
		//       TIE AJAX QUEUE TO STATE, BUT DON'T DISRUPT STATE IF NOT DONE
		//       PUT IN TEMP QUEUE, THEN COMBINE AT END OF EVERY AJAX CALL
		//       SHOULD BE A CLEANER WAY, BUT THIS SEEMS TO BE WORKING
		state.ajax.queue = state.ajax.queue.concat( PRISM.ajax.queue );
		PRISM.ajax.queue = [];

		this.setState( state );

		log( 12, 'end PrismTree.dequeueAJAX()' );
	},

	getData: function( request ) {

		log( 11, 'beg PrismTree.getData()' );

		var state = this.state;

		state.ajax.status = 'getting';

		this.setState( state );

		this.changeStatus( request.status );

		log( request );

		jQuery.ajax( {
			method  : 'GET',
			url     : request.url,
			success : this.dequeueAJAX,
			error   : this.dequeueAJAX
		} );

		log( 12, 'end PrismTree.getData()' );

	},

	trunkData: function() {

		log( 1, '---beg PrismTree.trunkData()' );

		var state = this.state;

		var trunkData = { 
			active  : state.active,
			width   : state.width.current.trunk,
			search  : state.search,
			status  : this.props.data.status,
			rainbow : this.props.data.rainbowBar
		};

		log( 2, '---end PrismTree.trunkData()' );

		return trunkData;

	},

	branchData: function() {

		log( 1, '---beg PrismTree.branchData()' );

		var branchData = { 
			leaves : [], 
			width  : this.state.width.current.branch,
			search : this.state.search,
			view   : PRISM.view.default
		};

		if ( this.hasActiveBranch() ) {

			var branch = this.state.active.branch;

			branchData.title  = branch;
			branchData.leaf   = this.state.active.leaf;
			branchData.view   = this.state.branches[branch].view;
			branchData.leaves = this.state.branches[branch].leaves;

		}

		if ( this.hasNestedBranch() ) {

			var route         = this.state.active.nested.route;
			var nestedBranch  = this.state.active.nested.branch;

			branchData.nested = this.state.active.nested;

			branchData.title  = this.state.active.branch;
			branchData.leaf   = this.state.active.leaf;
			branchData.view   = this.state.branches[route].view;
			branchData.leaves = this.state.branches[route].leaves;

		}

		log( 2, '---end PrismTree.branchData()' );

		return branchData;
	},

	leafData: function() {

		log( 1, '---beg PrismTree.leafData()' );

		var leafData = {};

		var branch = this.state.active.branch;
		var leaf   = this.state.active.leaf;

		if ( this.hasActiveBranch() ) {

			branch = this.state.branches[branch];

			if ( this.hasActiveLeaf() )
				leafData = branch.leaves[leaf];

		}

		if ( this.hasNestedBranch() ) {

			branch = this.state.active.nested.route;

			branch = this.state.branches[branch];

			if ( this.hasNestedLeaf() )
				leafData = branch.leaves[leaf];

		}

		leafData.width            = this.state.width.current;
		leafData.metaActive       = this.state.active.meta;
		leafData.currentlyChanged = this.state.currentlyChanged;

		log( 2, '---end PrismTree.leafData()' );

		return leafData;
	},

	metaData: function() {

		log( 1, '---beg PrismTree.metaData()' );

		var metaData = { connections : [] };

		if ( this.hasActiveBranch() ) {

			var branch = this.state.active.branch;
			var leaf   = this.state.active.leaf;

			var branches = this.state.branches;
			var leaves   = branches[branch].leaves;

			// TODO: Currently cycles through whole map, convert to 'some' or use for/break?
			PRISM.branches.map( function( b, i ) {
				if ( b.slug.plural == branch ) metaData.branch = b;
			} );

			if ( this.hasActiveLeaf() ) {

				PRISM.meta.default.map( function( key, i ) {
					metaData[key] = leaves[leaf][key];
				}, this );

				PRISM.branches.map( function( b, i ) {

					if ( b.slug.plural == branch ) {

						metaData.connections = b.connections;

						b.connections.map( function( connection, i ) {

							// An array of post_ids in another branch
							// (actor ids in the actor branch)
							var keys = leaves[leaf][connection];

							metaData[connection] = {};

							keys.map( function( key, i ) {
								metaData[connection][key] = {};
							} );

							var connectionBranch = this.state.branches[connection];

							console.log( 'cb: ', connectionBranch );

							if ( connectionBranch == undefined ) {

								this.loadBranch( connection );

								keys.map( function( key, i ) {
									metaData[connection][key]['name'] = key;
								} );

							} else {

								keys.map( function( key, i ) {
									metaData[connection][key]['name'] = branches[connection].leaves[key].title.rendered;
								} );

							}


						}, this );

					}
				}, this );

			}

		}

		metaData.width            = this.state.width.current.meta;
		metaData.metaActive       = this.state.active.meta;
		metaData.lockMeta         = this.state.lockMeta;
		metaData.currentlyChanged = this.state.currentlyChanged;

		log( metaData );

		log( 2, '---end PrismTree.metaData()' );

		return metaData;
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

		log( 11, 'beg PrismTree.render()' );

		var auth = this.props.auth;
		var func = this.props.func;

		var trunkFunctions  = {
			changeWidth   : this.changeWidth,
			resetWidth    : this.resetWidth,
			toggleRainbow : func.toggleRainbow,
			search        : this.search
		};

		var branchFunctions = {
			loadBranch  : this.loadBranch,
			changeLeaf  : this.changeLeaf,
			changeView  : this.changeView,
			changeWidth : this.changeWidth,
			resetWidth  : this.resetWidth,
			addLeaf     : this.addLeaf
		};

		var leafFunctions   = {
			changeMeta  : this.changeMeta,
			changeValue : this.changeValue,
			changeWidth : this.changeWidth,
			resetWidth  : this.resetWidth,
			saveLeaf    : this.saveLeaf
		}

		var metaFunctions   = {
			changeValue : this.changeValue,
			lockMeta    : this.lockMeta,
			saveLeaf    : this.saveLeaf
		};

		var prismTrunk   = <PrismTrunk  func={trunkFunctions}  auth={auth} data={this.trunkData()}  />;
		var prismBranch  = <PrismBranch func={branchFunctions} auth={auth} data={this.branchData()} />;
		var prismLeaf    = <PrismLeaf   func={leafFunctions}   auth={auth} data={this.leafData()}   />;
		var prismMeta    = <PrismMeta   func={metaFunctions}   auth={auth} data={this.metaData()}   />;

		var renderTrunk  = prismTrunk; // For code consistency
		var renderBranch = this.hasActiveBranch() || this.hasNestedBranch() ? prismBranch : null;
		var renderLeaf   = this.hasActiveLeaf()   || this.hasNestedLeaf()   ? prismLeaf   : null;
		var renderMeta   = this.hasActiveMeta()   ? prismMeta   : null;

		log( 12, 'end PrismTree.render()' );
		log( 12, '----------------------' );

		return (

			<div id="prism-tree">
				{renderTrunk}
				{renderBranch}
				{renderLeaf}
				{renderMeta}
			</div>

		);
	}

} );