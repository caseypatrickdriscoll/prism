/**
 * Utilities used in all parts of the application
 */


var PrismResizeBar = React.createClass( {

	render: function() {

		var data = this.props.data;
		var func = this.props.func;

		return(
			<div draggable="true" className="prism-resize-bar" onDoubleClick={func.resetWidth} onDrag={func.changeWidth}></div>
		)
	}

} );

var PrismIcon = React.createClass( {

	lockMeta: function(e) {
		e.preventDefault();

		this.props.func.lockMeta();
	},

	changeMeta: function(e) {
		e.preventDefault();

		this.props.func.changeMeta();
	},

	render: function() {

		var auth = this.props.auth;
		var data = this.props.data;
		var func = this.props.func;

		var lockIcon      = data.lockMeta == 'lock' ? 'lock' : 'unlock-alt';

		var lockClasses   = "fa fa-2x fa-pull-right lock-meta fa-" + lockIcon;
		var toggleClasses = "fa fa-2x fa-pull-left toggle-meta";

		toggleClasses    += data.metaActive ? ' fa-toggle-right active' : ' fa-toggle-left';

		var classes     = this.props.type == 'lock' ? lockClasses : toggleClasses;
		var handleClick = this.props.type == 'lock' ? this.lockMeta : this.changeMeta;

		return (
			<i className={classes} onClick={handleClick}></i>
		)
	}

} );

var log = function( level, message ) {

	// For log( message ) calls to set default
	if ( ! _.isNumber( level ) ) {
		message = level;
		level   = 10000;
	}

	if ( parseInt( PRISM.debug.level ) <= level ) {

		var ignore = false;

		PRISM.debug.ignore.map( function( obj ) {
			if ( _.isString( message ) && message.indexOf( obj ) >= 0 ) ignore = true;
		} );

		if ( ! ignore ) console.log( _.now(), message );
	}
}


var changeHash = function( sections ) {
	var newLink = '';

	sections.map( function( piece ) {
		newLink += '/' + piece;
	} );

	window.location.hash = newLink;
}


var getSingular = function( branch ) {

	var singularBranch;

	PRISM.branches.map( function( b, i ) {
		if ( b.slug.plural == branch ) singularBranch = b.slug.single;
	} );

	return singularBranch;

}


var get_today = function( obj ) {
	log( 'This is just stub function, working as proof of concept for now.' );
	log( obj.state );
}

