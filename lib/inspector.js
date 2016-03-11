var Inspector = function(options)
{
	var $this = this,
		$cache = [],
		$contentdelay = -1;

	$this.Pane = $(options.Pane || '<div class="inspector">')
		.appendTo('body')
		.append('<textarea>')
		.append('<iframe class="display">');

	$this.Shadow = $('<iframe style="display: none" name="shadow_' + (new Date * 1) + '" />').appendTo('body');
	$this.ShadowDocument = ($this.Shadow[0].contentDocument ||  $this.Shadow[0].contentWindow.document);

	$this.Preview = $this.Pane.find('> iframe.display');
	$this.PreviewDocument = ($this.Preview[0].contentDocument ||  $this.Preview[0].contentWindow.document);

	$this.CodeMirror = CodeMirror.fromTextArea(
		$this.Pane.find('> textarea')
			.val(options.Content || '<html>\n' + document.documentElement.innerHTML + '\n</html>')[0],
	$.extend(
	{
		lineNumbers: true,
		matchTags: { bothTags: true },
		mode: 'text/html'
	}, options.CodeMirror || {}));

	$this.CodeMirror.on('change', function(e)
	{
		$this.UpdatePreview();
    });

	$this.UpdateEditor = function(code)
	{
		$this.CodeMirror.setValue(code);
	};

	$this.UpdatePreview = function()
	{
		var code = $this.CodeMirror.getValue(),
			i = 0;

		$this.PreviewDocument.open();
		$this.PreviewDocument.write(code);
		$this.PreviewDocument.close();

		$('*', $this.PreviewDocument).each(function()
		{
			$.data(this, 'cm-tag-index', i);
			i ++;
		});

		$this.Preview[0].contentWindow.addEventListener('mousemove', $this.Seek);
		$this.Preview[0].contentWindow.addEventListener('click', function(e)
		{
			if(e.toElement != $this.PreviewDocument.documentElement)
			{
				$this.Select(e);
			}

			return false;
		});
	};

	$this.SpanToPos = function(span)
	{
		span = $(span).first();

		if(span.length > 0)
		{
			var lineNumber = span.closest('.CodeMirror-code > div[style]').index(),
				lineView = $this.CodeMirror.display.renderedView[lineNumber],
				char = 0;

			for(var i in lineView.measure.map)
			{
				if(!char && typeof lineView.measure.map[i] == 'object' && lineView.measure.map[i].parentNode && span[0] == lineView.measure.map[i].parentNode)
				{
					char = lineView.measure.map[i - 1];
				}
			}

			return { line: lineNumber, ch: char };
		}

		return null;
	};

	$this.Seek = function(e)
	{
		$('.cm-inspector-highlight, .cm-inspector-highlight-line', $this.CodeMirror.display.lineDiv).removeClass('cm-inspector-highlight cm-inspector-highlight-line');

		var i = $.data(e.target, 'cm-tag-index'),
			tags = $('.cm-tag.cm-bracket', $this.CodeMirror.display.lineDiv).filter(function()
			{
				return !!$(this).text().match(/^([\s]+)?>?<([\s]+)?$/);
			}),
			el = [tags[i]];

		el.push($(tags[i]).nextUntil('.cm-tag.cm-bracket').each(function()
		{
			el.push(this);
		}).next()[0]);

		$(el).addClass('cm-inspector-highlight').closest('.CodeMirror-line').addClass('cm-inspector-highlight-line');
	};

	$this.Select = function(e)
	{
		var pos = $this.SpanToPos($('.cm-inspector-highlight', $this.CodeMirror.display.lineDiv));

		$('.cm-inspector-highlight, .cm-inspector-highlight-line', $this.CodeMirror.display.lineDiv).removeClass('cm-inspector-highlight cm-inspector-highlight-line');

		if(pos)
		{
			$this.CodeMirror.focus();
			$this.CodeMirror.doc.setCursor(pos);

			var matchingpos = $this.SpanToPos($('.cm-tag.cm-bracket.CodeMirror-matchingtag', $this.CodeMirror.display.lineDiv).last());

			$this.CodeMirror.doc.setSelection({ line: pos.line, ch: pos.ch - 1 }, { line: matchingpos.line, ch: matchingpos.ch });
		}
	};

	$this.UpdatePreview();
};
