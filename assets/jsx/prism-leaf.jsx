var PrismLeaf = React.createClass( {

	getInitialState : function() {
		return { edit : false }
	},

	toggleEdit: function(e) {

		if ( this.props.auth ) {

			if ( this.state.edit ) this.prepLeaf(e);

			this.setState( { edit : this.state.edit ? false : true } );

		}

	},

	prepLeaf: function(e) {

		var data = this.props.data;
		var func = this.props.func;

		if ( ! data.currentlyChanged ) return;

		data = {
			'id'     : data.id,
			'status' : 'publish'
		};

		data[e.target.dataset.key] = e.target.value;

		func.saveLeaf( 'update', data );

	},

	autoSelect: function(e) {
		e.nativeEvent.target.select();
	},

	renderContentPanel: function() {

		var auth = this.props.auth;
		var data = this.props.data;
		var func = this.props.func;

		var content;

		if ( data.type == 'attachment' ) 
			content = <img src={data.source_url} />;
		else
			content = data.content.rendered;

		var editContent    = <textarea autoFocus id="prism-leaf-content" data-key="content" value={content} onBlur={this.toggleEdit} onFocus={this.autoSelect} onChange={func.changeValue} />;
		var staticContent  = <pre id="prism-leaf-content" onDoubleClick={this.toggleEdit}>{content}</pre>;

		var renderContent  = this.state.edit == true ? editContent : staticContent;

		return renderContent;

	},

	renderMetaPanel: function() {

		var auth = this.props.auth;
		var data = this.props.data;
		var func = this.props.func;

		if ( data.isMetaPanelOpen )
			return <PrismLeafMetaPanel auth={auth} data={data} func={func} />;
		else
			return null;

	},

	render: function() {

		var auth = this.props.auth;
		var data = this.props.data;
		var func = this.props.func;

		func.prepLeaf = this.prepLeaf;
		func.autoSelect = this.autoSelect;

		var style = { 'width' : data.width + '%' };

		var leafClasses = data.isMetaPanelOpen ? 'metapanel-open' : 'metapanel-closed';

		return (
			<div id="prism-leaf" className={leafClasses} style={style}>
				<PrismLeafHeader auth={auth} data={data} func={func} />
				{this.renderContentPanel()}
				{this.renderMetaPanel()}
			</div>
		);
	}

} );