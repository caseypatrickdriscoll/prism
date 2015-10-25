var PrismTrunk = React.createClass( {

	render: function() {

		var data = this.props.data;
		var func = this.props.func;

		var style = { 'width' : data.width + '%' };

		return (
			<div id="prism-trunk" style={style} data-section='trunk'>
				<PrismSearchStatus data={data} func={func} />
				<PrismMenu         data={data} />
				<PrismResizeBar    data={data} func={func} />
			</div>
		);
	}

} );


var PrismSearchStatus = React.createClass( {

	timeout: null,

	getInitialState : function() {
		var state = { 
			showStatus   : false, 
			status : { 
				type    : null, 
				message : null, 
				time    : null 
			}
		};

		return state;
	},

	componentWillReceiveProps : function() {
		var data  = this.props.data;
		var state = this.state;

		var logs  = data.status.log.length;

		if ( logs == 0 ) {
			state.showStatus = false;
			state.status = { type: null, message : null, time : null };
		} else {
			if ( data.status.log[logs - 1].time == state.status.time ) return;
			state.showStatus = true;
			state.status = data.status.log[logs - 1];
		}

		if ( this.timeout != null )
			clearTimeout( this.timeout );

		this.timeout = setTimeout( this.hide, PRISM.status.timeout );

		this.setState( state );
	},

	hide: function() {
		var state = this.state;

		state.showStatus = false;

		this.setState( state );
	},

	changeBranch: function() {

		var search = this.props.data.search;

		if ( search.query == '' || search.last == search.query )
			window.location = '/#/search';

	},

	search: function(e) {

		log( 11, 'beg PrismSearch.search()' );

		var search = this.props.data.search;
		var value  = e.target.value;

		if ( value == '' ) {
			window.location = '/#/';
			return;
		}

		window.location = '/#/search?query=' + value;

		log( 12, 'end PrismSearch.search()' );

	},

	autoSelect: function(e) {
		e.nativeEvent.target.select();
	},

	render: function() {

		var data = this.props.data;
		var func = this.props.func;

		var value   = data.search.query;
		var focus   = data.branch == 'search' ? true : false;
		var classes = data.branch == 'search' ? 'active' : '';

		var status     = this.state;
		status.rainbow = data.rainbow;

		return (
			<div id="prism-search-status" className={classes}>
				<PrismRainbowButton data={status} func={func} />
				<PrismRainbowStatus data={status} func={func} />
				<input type="text" placeholder="Search" defaultValue={value} onClick={this.changeBranch} onBlur={this.search} onFocus={this.autoSelect} autoFocus={focus} />
			</div>
		);

	}

} );


var PrismMenu = React.createClass( {

	render: function() {

		var data = this.props.data;

		var menuItems = PRISM.branches.map( function( branch, i ) {

			var namePlural = branch.slug.plural;

			var active  = namePlural == data.active.branch;
			var nested  = data.active.nested;

			var classes = active ? 'active'  : '';
			classes    += active && nested != null ? ' nested' : '';

			var title   = branch.title;

			var nestedLink = function() {

				if ( active && nested != null ) {

					var nameNested;

					PRISM.branches.map( function( branch, i ) {
						if ( branch.slug.plural == nested.branch ) nameNested = branch.slug.single;
					} );

					var href = '/#/' + nameNested + '/' + nested.leaf;

					var link = <a href={href} className='active nested'>in {nameNested} {nested.leaf}</a>
				}

				return link;

			}.bind( this );


			var iconClasses = branch.icon == null ? "fa fa-fw fa-thumb-tack" : "fa fa-fw " + branch.icon;

			return (
				<li key={i}>
					<a href={'/#/' + namePlural} id={namePlural} className={classes} data-slug={namePlural}>
						<i className={iconClasses}></i>{title}
					</a>
					{nestedLink()}
				</li>
			);

		}, this );

		return (
			<menu id="prism-menu">
				<ul>
					{menuItems}
				</ul>
			</menu>
		);
	}

} );