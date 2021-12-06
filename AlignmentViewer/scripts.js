var partitionCanvas;
var mainCanvas;
var partNameCanvas;

var pCtx;
var ctx;
var partNameCtx;

var partitions = [];
var partitionCanvasScroll = 0;

function loaded()
{
	let testCanvas = document.createElement("canvas");
	let testContext = testCanvas.getContext("2d");
	
	testContext.font = "bold 12px Roboto Mono";
	testContext.fillText("test", 0, 0);
	
	
	partitionCanvas = document.getElementById("partitionCanvas");
	mainCanvas = document.getElementById("mainCanvas");
	partNameCanvas = document.getElementById("partNameCanvas");
	
	setTimeout(function() {
		partitionCanvas.width = partitionCanvas.clientWidth;
		partitionCanvas.height = partitionCanvas.clientHeight;
		
		mainCanvas.width = mainCanvas.clientWidth;
		mainCanvas.height = mainCanvas.clientHeight;
		
		partNameCanvas.width = partNameCanvas.clientWidth;
		partNameCanvas.height = partNameCanvas.clientHeight;
	}, 100);
	
	pCtx = partitionCanvas.getContext("2d");
	ctx = mainCanvas.getContext("2d");
	partNameCtx = partNameCanvas.getContext("2d");
	
	pCtx.textBaseline = "top";
	ctx.textBaseline = "top";
	
	partitionCanvas.addEventListener("mousedown", partitionCanvasMouseDown);
	partitionCanvas.addEventListener("mouseup", partitionCanvasMouseUp);
	partitionCanvas.addEventListener("mousemove", partitionCanvasMouseMove);
	partitionCanvas.addEventListener("mousewheel", partitionCanvasMouseWheel);
	
	mainCanvas.addEventListener("mousedown", mainCanvasMouseDown);
	mainCanvas.addEventListener("mouseup", mainCanvasMouseUp);
	mainCanvas.addEventListener("mousemove", mainCanvasMouseMove);
	mainCanvas.addEventListener("mousewheel", mainCanvasMouseWheel);
	
	{
		var count = 0;
		var table = document.createElement("table");
		table.style.height = "100%";
		var tr1 = table.insertRow(-1);
		
		for (var i in AAColors)
		{
			var nameCell = tr1.insertCell(-1);
			nameCell.innerHTML = i.replace("-", "–");
			nameCell.style.textAlign = "right";
			nameCell.style.paddingLeft = "0.5em";
			
			var cell = tr1.insertCell(-1);
			var inp = document.createElement("input");
			inp.type = "color";
			inp.value = colToHEX(AAColors[i]);
			inp.style.width = 20;
			inp.style.padding = 0;
			inp.id = "col" + i;
			inp.addEventListener("change", function() { var chr = this.id.replace("col", ""); AAColors[chr] = colFromHEX(this.value); drawAlignment(); });
			cell.appendChild(inp);
			count++;
			if (count % 7 == 0 && count < 21)
			{
				tr1 = table.insertRow(-1);
			}
		}
		
		document.getElementById("aminoAcidColorCont").appendChild(table);
	}
	
	{
		var count = 0;
		var table = document.createElement("table");
		table.align="center";
		table.style.height = "100%";
		
		var tr1 = table.insertRow(-1);
		
		for (var i in NucColors)
		{
			var nameCell = tr1.insertCell(-1);
			nameCell.innerHTML = i.replace("-", "–");
			nameCell.style.textAlign = "right";
			nameCell.style.paddingLeft = "0.5em";
			
			var cell = tr1.insertCell(-1);
			var inp = document.createElement("input");
			inp.type = "color";
			inp.value = colToHEX(NucColors[i]);
			inp.style.width = 20;
			inp.style.padding = 0;
			inp.id = "col" + i;
			inp.addEventListener("change", function() { var chr = this.id.replace("col", ""); NucColors[chr] = colFromHEX(this.value); drawAlignment(); });
			cell.appendChild(inp);
			count++;
			
			if (count % 2 == 0 && count < 6)
			{
				tr1 = table.insertRow(-1);
			}
		}
		
		document.getElementById("nucColorCont").appendChild(table);
	}
	
	window.addEventListener("resize", resized);
}

function resized(event)
{
	partitionCanvas.width = 10;
	partitionCanvas.height = 300;
	
	mainCanvas.width = 10;
	mainCanvas.height = 10;
	
	partNameCanvas.width = 10;
	partNameCanvas.height = 10;
	
	partitionCanvas.style.height = "300";
	
	setTimeout(function() {
		partitionCanvas.style.height = "100%";
				
		setTimeout(function() {
			
		partitionCanvas.width = partitionCanvas.clientWidth;
		partitionCanvas.height = partitionCanvas.clientHeight;
		
		mainCanvas.width = mainCanvas.clientWidth;
		mainCanvas.height = mainCanvas.clientHeight;
		
		partNameCanvas.width = partNameCanvas.clientWidth;
		partNameCanvas.height = partNameCanvas.clientHeight;
		drawEverything();
		}, 100);
	}, 100);
}

function colToHEX(col)
{
	col = col.replace("rgb(", "").replace("rgba(", "").replace(" ", "").replace(")", "").split(",");
	return "#" + parseInt(col[0]).toString(16) + parseInt(col[1]).toString(16) + parseInt(col[2]).toString(16);
}

function colFromHEX(col)
{
	col = col.replace("#", "");
	var R = col.substr(0, 2);
	var G = col.substr(2, 2);
	var B = col.substr(4, 2);
	return "rgb(" + parseInt(R, 16) + ", " + parseInt(G, 16) + ", " + parseInt(B, 16) + ")";
}

function dropped(e)
{
	e.preventDefault();
	
	var dt = e.dataTransfer;
	if (dt.items)
	{
		for (var i = 0; i < dt.items.length; i++)
		{
			if (dt.items[i].kind == "file")
			{
				var f = dt.items[i].getAsFile();
				loadAlignment(f);
			}
		}
	}
	else
	{
		for (var i=0; i < dt.files.length; i++)
		{
			loadAlignment(dt.files[i]);
		}
	}
}

function handleInput(e, sender)
{
	for (var i = 0; i < sender.files.length; i++)
	{
		loadAlignment(sender.files[i]);
	}
}

function loadAlignment(file)
{
	var reader = new FileReader();
	reader.onload = function (e)
	{
		var cnt = readSequences(e.target.result);
		if (!cnt.IsJson)
		{
			var maxLen = 0;
			
			var type = undefined;
			
			for (var i = 0; i < cnt.length; i++)
			{
				maxLen = Math.max(maxLen, cnt[i].Sequence.length);
			}
			
			for (var i = 0; i < cnt.length; i++)
			{
				if (cnt[i].Sequence.length < maxLen)
				{
					cnt[i].Sequence += "-".repeat(maxLen - cnt[i].Sequence.length);
				}
				if (cnt[i].Type != type)
				{
					if (type == undefined)
					{
						type = cnt[i].Type;
					}
					else
					{
						type = "Unknown";
					}
				}
			}
			
			partitions.push({ Content: cnt, FileName: file.name, Name: file.name.lastIndexOf(".") > 0 ? file.name.substr(0, file.name.lastIndexOf(".")) : file.name, Active: true, Length: maxLen, Selected: false, Type: type, Mask: "1".repeat(maxLen), MaskedLength: function(action) { return getPartitionMaskedLength(this, action); } });
		}
		else
		{
			for (var i = 0; i < cnt.Content.length; i++)
			{
				cnt.Content[i].MaskedLength = function(action) { return getPartitionMaskedLength(this, action); };
				partitions.push(cnt.Content[i]);
			}
		}
		document.getElementById("loadDiv").style.display = "none";
		drawEverything();
	};
	reader.readAsText(file);
}

function getPartitionMaskedLength(partition, action)
{
	if (action != "hide")
	{
		return partition.Length;
	}
	
	if (partition.Mask.length < partition.Length)
	{
		partition.Mask += "1".repeat(partition.Length - partition.Mask.length);
	}
	else if (partition.Mask.length > partition.Length)
	{
		partition.Mask = partition.Mask.substr(0, partition.Length);
	}
	
	return partition.Mask.replaceAll("0", "").length;
}

function drawPartitions()
{
	pCtx.clearRect(0, 0, partitionCanvas.width, partitionCanvas.height);
	pCtx.save();
	pCtx.translate(0, 32);
	
	var scrollbarVisible = partitions.length * 24 + 64 > partitionCanvas.height;
	
	if (scrollbarVisible)
	{
		pCtx.translate(0, -partitionCanvasScroll * 24);
	}
	
	var selectedCount = 0;
	
	pCtx.font = "16px Open Sans";
	pCtx.textBaseline = "middle";
	for (var i = 0; i < partitions.length; i++)
	{
		if (i % 2 == 1)
		{
			pCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
			pCtx.fillRect(0, 0, partitionCanvas.width, 24);
		}
		
		if (partitions[i].Selected)
		{
			pCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
			pCtx.fillRect(0, 0, partitionCanvas.width, 24);
			pCtx.font = "bold 16px Open Sans";
			selectedCount++;
		}
		else
		{
			pCtx.font = "16px Open Sans";
		}
		
		pCtx.fillStyle = "white";
		pCtx.strokeStyle = "rgba(0, 0, 0, 0.5)";
		pCtx.lineWidth = 1;
		pCtx.fillRect(4, 6, 12, 12);
		pCtx.strokeRect(4, 6, 12, 12);
		
		if (partitions[i].Active)
		{
			pCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
			pCtx.fillRect(7, 9, 6, 6);
		}
		
		if (partitions[i].Type == "Protein")
		{
			drawProteinIcon(pCtx, 20, 4, 16, 16);
		}
		else if (partitions[i].Type == "Nucleotide")
		{
			drawDNAIcon(pCtx, 20, 4, 16, 16);
		}
		
		pCtx.fillStyle = "rgba(0, 0, 0, 0.75)";
		pCtx.fillText(partitions[i].Name, 40, 12);
		
		pCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
		var pLTxt = partitions[i].Length + " (" + partitions[i].MaskedLength("hide") + ")";
		pCtx.fillText(pLTxt, partitionCanvas.width - 4 - (scrollbarVisible ? 20 : 0) - pCtx.measureText(pLTxt).width, 12);
		
		pCtx.translate(0, 24);
	}
	
	pCtx.restore();
	pCtx.clearRect(0, 0, partitionCanvas.width, 32);
	pCtx.clearRect(0, partitionCanvas.height - 32, partitionCanvas.width, 32);
	pCtx.textBaseline = "top";
	
	pCtx.fillStyle = "black";
	pCtx.font = "bold 20px Open Sans";
	pCtx.fillText("Partitions", 0, 0);
	
	pCtx.strokeStyle = "rgba(0, 0, 0, 0.25)";
	pCtx.lineWidth = 2;
	pCtx.beginPath();
	pCtx.moveTo(0, 30);
	pCtx.lineTo(partitionCanvas.width, 30);
	pCtx.stroke();
	
	partitionButtonsEnabled[0] = selectedCount > 0;
	partitionButtonsEnabled[1] = selectedCount == 1;
	partitionButtonsEnabled[2] = selectedCount == 1;
	partitionButtonsEnabled[3] = partitions.length > 0;
	partitionButtonsEnabled[4] = partitions.length > 0;
	partitionButtonsEnabled[5] = selectedCount == 1;
	
	drawButtons(pCtx, 0, partitionCanvas.height - 30, partitionCanvas.width);
	
	if (scrollbarVisible)
	{
		drawVScrollBar(pCtx, partitionCanvas.width - 16, 32, partitionCanvas.height - 64, partitionCanvasScroll, partitions.length - Math.floor((partitionCanvas.height - 64) / 24), partitionCanvasScrollBarHover, partitionCanvasScrolling);
	}
}

var partitionCanvasScrollBarHover = false;

function drawVScrollBar(context, x, y, height, position, max, hover, active)
{
	position = Math.max(0, Math.min(position, max));
	context.save();
	context.translate(x, y);
	context.clearRect(0, 0, 16, height);
	context.fillStyle = "rgba(0, 0, 0, 0.1)";
	context.fillRect(0, 0, 16, height);
	
	context.fillStyle = "rgba(0, 0, 0, 0.5)";
	context.beginPath();
	context.moveTo(8, 6);
	context.lineTo(12, 10);
	context.lineTo(4, 10);
	context.fill();
	
	context.beginPath();
	context.moveTo(8, height - 6);
	context.lineTo(12, height - 10);
	context.lineTo(4, height - 10);
	context.fill();
	
	var caretHeight = Math.max(16, (height - 32) / (max + 1));
	
	context.fillStyle = active ? "rgba(0, 0, 0, 0.5)" : hover ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)";
	context.fillRect(2, 16 + (height - 32 - caretHeight) * (position / max), 12, caretHeight);
	
	context.restore();
}

function drawProteinIcon(context, x, y, width, height)
{
	context.save();
	context.translate(x, y);
	context.scale(width / 32, height / 32);
	
	context.fillStyle = "black";
	context.beginPath();
	context.arc(5, 27, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(11, 22, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(18, 24, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(24, 18, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(28, 12, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(22, 8, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(16, 10, 4, 0, 2 * Math.PI);
	context.fill();
	context.beginPath();
	context.arc(12, 4, 4, 0, 2 * Math.PI);
	context.fill();
	
	context.restore();
}

function drawDNAIcon(context, x, y, width, height)
{
	context.save();
	context.translate(x, y);
	context.scale(width / 32, height / 32);
	
	context.lineWidth = 3;
	context.strokeStyle = "black";
	
	context.beginPath();
	context.moveTo(6, 0);
	context.bezierCurveTo(64, 12, -32, 20, 28, 32);
	context.stroke();
	
	context.beginPath();
	context.moveTo(28, 0);
	context.bezierCurveTo(-32, 12, 64, 20, 4, 32);
	context.stroke();
	context.restore();
}

var partitionCanvasScrolling = false;
var partitionCanvasScrollStartY = 0;
var partitionCanvasScrollPrevVal = 0;

function partitionCanvasMouseDown(event)
{
	var rect = partitionCanvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
	
	if (x >= 4 && x <= 16)
	{
		if (y < partitionCanvas.height - 32 && (y - 32 + partitionCanvasScroll * 24) % 24 >= 6 && (y - 32 + partitionCanvasScroll * 24) % 24 <= 18)
		{
			var ind = Math.floor((y - 32 + partitionCanvasScroll * 24) / 24);
			if (ind >= partitionCanvasScroll && ind < partitions.length)
			{
				partitions[ind].Active = !partitions[ind].Active;
				drawEverything();
			}
		}
	}
	else if (y < partitionCanvas.height - 32 && (x < partitionCanvas.width - 16 || partitions.length * 24 + 64 <= partitionCanvas.height))
	{
		var ind = Math.floor((y - 32 + partitionCanvasScroll * 24) / 24);

		if (!event.ctrlKey && !event.shiftKey)
		{
			for (var i = 0; i < partitions.length; i++)
			{
				partitions[i].Selected = false;
			}
		}

		if (ind >= partitionCanvasScroll && ind < partitions.length)
		{
			partitions[ind].Selected = (!event.ctrlKey && !event.shiftKey) ? true : !partitions[ind].Selected;
		}
		drawPartitions();
	}
	else if (y >= partitionCanvas.height - 32)
	{
		var ind = Math.floor(6 * x / partitionCanvas.width);
		ind = Math.max(0, Math.min(ind, 5));
		
		if (Math.abs(x % (partitionCanvas.width / 6) - partitionCanvas.width / 12) <= 15)
		{
			partitionButtonsActive[ind] = true;
		}
		drawPartitions();
	}
	else
	{
		var height = partitionCanvas.height - 64;
		var max = partitions.length - Math.floor((partitionCanvas.height - 64) / 24);
		var caretHeight = Math.max(16, (height - 32) / (max + 1));
		var caretY = 16 + (height - 32 - caretHeight) * (partitionCanvasScroll / max);
		
		if (y >= caretY + 32 && y <= caretY + 32 + caretHeight)
		{
			partitionCanvasScrolling = true;
			partitionCanvasScrollStartY = y;
			partitionCanvasScrollPrevVal = partitionCanvasScroll;
			drawPartitions();
		}
	}
}

function partitionCanvasMouseMove(event)
{
	var rect = partitionCanvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	
	partitionButtonsHover = [false, false, false, false, false, false];
	partitionCanvas.style.cursor = "default";
	
	if (y >= 32 && y <= partitionCanvas.height - 32 && x >= partitionCanvas.width - 16 &&  partitions.length * 24 + 64 > partitionCanvas.height)
	{
		var height = partitionCanvas.height - 64;
		var max = partitions.length - Math.floor((partitionCanvas.height - 64) / 24);
		var caretHeight = Math.max(16, (height - 32) / (max + 1));
		var caretY = 16 + (height - 32 - caretHeight) * (partitionCanvasScroll / max);
		
		if (y >= caretY + 32 && y <= caretY + 32 + caretHeight)
		{
			partitionCanvasScrollBarHover = true;
		}
		else
		{
			partitionCanvasScrollBarHover = false;
		}
	}
	else
	{
		partitionCanvasScrollBarHover = false;
	}
	
	if (partitionCanvasScrolling)
	{
		var height = partitionCanvas.height - 64;
		var max = partitions.length - Math.floor((partitionCanvas.height - 64) / 24);
		var caretHeight = Math.max(16, (height - 32) / (max + 1));
		
		var delta = ((y - partitionCanvasScrollStartY) / (height - 32 - caretHeight)) * max;
		
		partitionCanvasScroll = Math.max(0, Math.min(partitionCanvasScrollPrevVal + delta, max));
	}
	else if (event.buttons == 1)
	{
		var ind = Math.floor((y - 32 + partitionCanvasScroll * 24) / 24);

		if (y < partitionCanvas.height - 32 && ind >= partitionCanvasScroll && ind < partitions.length)
		{
			partitions[ind].Selected = true;
		}		
	}
	else if (y >= partitionCanvas.height - 32)
	{
		var ind = Math.floor(6 * x / partitionCanvas.width);
		ind = Math.max(0, Math.min(ind, 5));
		
		if (Math.abs(x % (partitionCanvas.width / 6) - partitionCanvas.width / 12) <= 15)
		{
			partitionButtonsHover[ind] = true;
			
			if (partitionButtonsEnabled[ind])
			{
				partitionCanvas.style.cursor = "hand";
			}
		}
	}
	drawPartitions();
}

function partitionCanvasMouseUp(event)
{
	partitionCanvasScrolling = false;
	
	var rect = partitionCanvas.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;
	
	if (y >= partitionCanvas.height - 32)
	{
		var ind = Math.floor(6 * x / partitionCanvas.width);
		ind = Math.max(0, Math.min(ind, 5));
		
		if (Math.abs(x % (partitionCanvas.width / 6) - partitionCanvas.width / 12) <= 15 && partitionButtonsActive[ind] && partitionButtonsEnabled[ind])
		{
			switch(ind)
			{
				case 0:
					for (var i = partitions.length - 1; i >= 0; i--)
					{
						if (partitions[i].Selected)
						{
							partitions.splice(i, 1);
						}
					}
					mainScroll = [0, 0];
					break;
				
				case 1:
					for (var i = partitions.length - 1; i >= 0; i--)
					{
						if (partitions[i].Selected)
						{
							var nam = prompt("New partition name?", partitions[i].Name);
							if (nam != "" && nam != undefined)
							{
								partitions[i].Name = nam;
							}
							break;
						}
					}
					break;
				case 2:
					for (var i = partitions.length - 1; i >= 0; i--)
					{
						if (partitions[i].Selected)
						{
							if (i > 0)
							{
								el = partitions.splice(i, 1)[0];
								partitions.splice(i - 1, 0, el);
							}
							break;
						}
					}
					break;
				case 5:
					for (var i = partitions.length - 1; i >= 0; i--)
					{
						if (partitions[i].Selected)
						{
							if (i < partitions.length - 1)
							{
								el = partitions.splice(i, 1)[0];
								partitions.splice(i + 1, 0, el);
							}
							break;
						}
					}
					break;
				case 3:
					partitions.sort(function(a, b) { return compareStrings(a.Name, b.Name); } );
					break;
				case 4:
					partitions.sort(function(a, b) { return a.Length - b.Length; } );
					break;
			}
		}
	}
	
	partitionButtonsActive = [false, false, false, false, false, false];
	drawEverything();
}

function compareStrings(a, b)
{
	if ("0123456789".contains(a.substr(0, 1)) && "0123456789".contains(b.substr(0, 1)))
	{
		return parseInt(a) - parseInt(b);
	}
	else
	{
		return a > b ? 1 : a < b ? -1 : 0;
	}
}

function partitionCanvasMouseWheel(event)
{
	var direction = (event.detail < 0 || event.wheelDelta > 0) ? -1 : 1;
	
	if (partitions.length * 24 + 64 > partitionCanvas.height)
	{
		
		var max = partitions.length - Math.floor((partitionCanvas.height - 64) / 24);
		partitionCanvasScroll = Math.max(0, Math.min(partitionCanvasScroll + direction, max));
		drawPartitions();
	}
}

var partitionButtonsHover = [ false, false, false, false, false, false ];
var partitionButtonsActive = [ false, false, false, false, false, false ];
var partitionButtonsEnabled = [ false, false, false, false, false, false ];

function drawButtons(context, x, y, width)
{
	context.save();
	context.translate(x, y);	
	
	context.translate(width / 12 - 15, 0);
	
	var delta = width / 6;
	
	//First button
	if (partitionButtonsEnabled[0] && (partitionButtonsHover[0] || partitionButtonsActive[0]))
	{
		if (partitionButtonsActive[0])
		{
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		}
		else
		{
			context.fillStyle = "rgba(0, 0, 0, 0.2)";
		}
		
		context.beginPath();
		context.arc(15, 15, 15, 0, 2 * Math.PI);
		context.fill();
	}
	
	context.fillStyle = partitionButtonsEnabled[0] ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.1)";
	context.strokeStyle = partitionButtonsEnabled[0] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.lineWidth = 2;
	
	context.fillRect(9, 7, 12, 18);
	context.beginPath();
	context.moveTo(9, 8);
	context.lineTo(9, 25);
	context.lineTo(21, 25);
	context.lineTo(21, 8);
	context.stroke();
	
	context.beginPath();
	context.moveTo(13, 13);
	context.lineTo(13, 22.5);
	context.moveTo(17, 13);
	context.lineTo(17, 22.5);
	context.stroke();
	
	context.beginPath();
	context.moveTo(5, 7);
	context.lineTo(25, 7);
	context.stroke();
	
	context.fillStyle = partitionButtonsEnabled[0] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.fillRect(11, 4, 8, 2);
	
	
	//Second button
	context.translate(delta, 0);
	
	if (partitionButtonsEnabled[1] && (partitionButtonsHover[1] || partitionButtonsActive[1]))
	{
		if (partitionButtonsActive[1])
		{
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		}
		else
		{
			context.fillStyle = "rgba(0, 0, 0, 0.2)";
		}
		
		context.beginPath();
		context.arc(15, 15, 15, 0, 2 * Math.PI);
		context.fill();
	}
	
	context.strokeStyle = partitionButtonsEnabled[1] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.lineWidth = 3;
	context.lineJoin = "round";
	context.beginPath();
	context.moveTo(6, 24);
	context.lineTo(15, 5);
	context.lineTo(24, 24);
	context.moveTo(9, 17.67);
	context.lineTo(21, 17.67);
	context.stroke();
	context.lineJoin = "miter";
	
	
	//Third button
	context.translate(delta, 0);
	if (partitionButtonsEnabled[2] && (partitionButtonsHover[2] || partitionButtonsActive[2]))
	{
		if (partitionButtonsActive[2])
		{
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		}
		else
		{
			context.fillStyle = "rgba(0, 0, 0, 0.2)";
		}
		
		context.beginPath();
		context.arc(15, 15, 15, 0, 2 * Math.PI);
		context.fill();
	}
	
	context.fillStyle = partitionButtonsEnabled[2] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.beginPath();
	context.moveTo(15, 10);
	context.lineTo(22, 17.5);
	context.lineTo(8, 17.5);
	context.fill();
	
	//Fourth button
	context.translate(delta, 0);
	if (partitionButtonsEnabled[3] && (partitionButtonsHover[3] || partitionButtonsActive[3]))
	{
		if (partitionButtonsActive[3])
		{
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		}
		else
		{
			context.fillStyle = "rgba(0, 0, 0, 0.2)";
		}
		
		context.beginPath();
		context.arc(15, 15, 15, 0, 2 * Math.PI);
		context.fill();
	}
	
	context.strokeStyle = partitionButtonsEnabled[3] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.lineWidth = 1.5;
	context.lineJoin = "round";
	context.beginPath();
	context.moveTo(10.5, 12);
	context.lineTo(15, 2.5);
	context.lineTo(19.5, 12);
	context.moveTo(12, 8.83);
	context.lineTo(18, 8.83);
	context.moveTo(10.5, 15);
	context.lineTo(19.5, 15);
	context.lineTo(10.5, 24.5);
	context.lineTo(19.5, 24.5);
	context.stroke();
	context.lineJoin = "miter";
	
	//Fifth button
	context.translate(delta, 0);
	if (partitionButtonsEnabled[4] && (partitionButtonsHover[4] || partitionButtonsActive[4]))
	{
		if (partitionButtonsActive[4])
		{
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		}
		else
		{
			context.fillStyle = "rgba(0, 0, 0, 0.2)";
		}
		
		context.beginPath();
		context.arc(15, 15, 15, 0, 2 * Math.PI);
		context.fill();
	}
	
	context.strokeStyle = partitionButtonsEnabled[4] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.lineWidth = 1.5;
	context.lineJoin = "round";
	context.beginPath();
	context.moveTo(12, 5.5);
	context.lineTo(15, 2.5);
	context.lineTo(15, 12.5);
	context.moveTo(12, 12.5);
	context.lineTo(18, 12.5);
	context.moveTo(12, 18.5);
	context.bezierCurveTo(18, 15.5, 19, 20.5, 12, 27.5);
	context.lineTo(18, 27.5);
	context.stroke();
	context.lineJoin = "miter";
	
	//Sixth button
	context.translate(delta, 0);
	if (partitionButtonsEnabled[5] && (partitionButtonsHover[5] || partitionButtonsActive[5]))
	{
		if (partitionButtonsActive[5])
		{
			context.fillStyle = "rgba(0, 0, 0, 0.4)";
		}
		else
		{
			context.fillStyle = "rgba(0, 0, 0, 0.2)";
		}
		
		context.beginPath();
		context.arc(15, 15, 15, 0, 2 * Math.PI);
		context.fill();
	}
	
	context.fillStyle = partitionButtonsEnabled[5] ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.25)";
	context.beginPath();
	context.moveTo(15, 20);
	context.lineTo(22, 12.5);
	context.lineTo(8, 12.5);
	context.fill();
	
	context.restore();
}


function drawEverything()
{
	drawPartitions();
	drawAlignment();
}