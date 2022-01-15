/*******************************************************************************
	AlignmentViewer - A web application to display, filter and combine
	sequence alignments.
    Copyright (C) 2017-2021 Giorgio Bianchini

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, version 3.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*******************************************************************************/

var AAColors = { A: "rgb(25, 128, 230)", C: "rgb(230, 128, 128)", D: "rgb(204, 77, 204)", E: "rgb(204, 77, 204)", F: "rgb(25, 128, 230)", G: "rgb(230, 153, 77)", H: "rgb(25, 179, 179)", I: "rgb(25, 128, 230)", K: "rgb(230, 51, 25)", L: "rgb(25, 128, 230)", M: "rgb(25, 128, 230)", N: "rgb(25, 204, 25)", P: "rgb(204, 204, 0)", Q: "rgb(25, 204, 25)", R: "rgb(230, 51, 25)", S: "rgb(25, 204, 25)", T: "rgb(25, 204, 25)", V: "rgb(25, 128, 230)", W: "rgb(25, 128, 230)", Y: "rgb(25, 179, 179)", "-": "rgb(255, 255, 255)" };

var NucColors = { A: "rgb(255, 64, 64)", C: "rgb(64, 255, 64)", T: "rgb(64, 64, 255)", U: "rgb(64, 64, 255)", G: "rgb(255, 255, 64)", "-": "rgb(255, 255, 255)" };

var alnLineHeight = 20;
var alnBlockWidth = 10;
var alnFontSize = 12;
var alnVMargin = 0;
var mainScroll = [0, 0];

var lastDrawnNameCount = 0;
var lastDrawnMaxNameLen = 0;
var lastDrawnTotalLength = 0;

var maskedAction = "blur";
var maskedBlurAlpha = 0.35;

var halfPixel = true;
var halfPixelY = false;

var labelFontSize = 16;

var drawAlignmentLetters = true;

var sortAlphabetically = false;

var selectedSequences = [];
var lastDrawnNames = [];

function drawAlignment()
{
	//var t0 = performance.now();
	
	var translations = [0, 0];
	ctx.save();
	
	if (halfPixel)
	{
		ctx.translate(0.5, 0);
		mainScroll = [ Math.round(mainScroll[0]), mainScroll[1] ];
	}
	
	if (halfPixelY)
	{
		ctx.translate(0, 0.5);
		mainScroll = [ mainScroll[0], Math.round(mainScroll[1]) ];
	}
	
	ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
	partNameCtx.clearRect(0, 0, partNameCanvas.width, partNameCanvas.height);
	
	var sequenceNames = [];
	
	var maxNameLen = 0;
	
	var totalSeqLen = 0;
	
	getPartitionBounds();
	
	ctx.font = labelFontSize + "px Open Sans";
	
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			for (var j = 0; j < partitions[i].Content.length; j++)
			{
				if (sequenceNames.indexOf(partitions[i].Content[j].Name) < 0)
				{
					sequenceNames.push(partitions[i].Content[j].Name);
					maxNameLen = Math.max(maxNameLen, ctx.measureText(partitions[i].Content[j].Name).width);
				}
			}
			totalSeqLen += partitions[i].MaskedLength(maskedAction);
		}
	}
	
	if (totalSeqLen == 0)
	{
		ctx.restore();
		return;
	}
	
	if (sortAlphabetically)
	{
		sequenceNames.sort();
	}
	
	lastDrawnNameCount = sequenceNames.length;
	lastDrawnNames = sequenceNames;
	lastDrawnTotalLength = totalSeqLen;
	
	ctx.textBaseline = "middle";

	ctx.translate(maxNameLen + 4, 0);
	translations[0] += maxNameLen + 4;
	
	ctx.font = "bold " + alnFontSize + "px Roboto Mono, monospace";
	partNameCtx.font = "bold 16px Open Sans";
	var drawLetters = drawAlignmentLetters && ctx.measureText("M").width < alnBlockWidth - 2;
	
	ctx.translate(0, alnLineHeight * 2);
	translations[1] += alnLineHeight * 2;
	
	var prevTransl = [translations[0], translations[1]];
	ctx.save();
	
	ctx.translate(mainScroll[0], mainScroll[1]);
	translations[0] += mainScroll[0];
	translations[1] += mainScroll[1];
	
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			if (translations[0] + (partitions[i].MaskedLength() + 1) * alnBlockWidth < maxNameLen + 4)
			{
				ctx.translate(partitions[i].MaskedLength(maskedAction) * alnBlockWidth, 0);
				translations[0] += partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
				continue;
			}
					
			for (var j = 0; j < partitions[i].Content.length; j++)
			{
				var ind = sequenceNames.indexOf(partitions[i].Content[j].Name);
				if (translations[1] + ind * alnLineHeight >= mainCanvas.height)
				{
					continue;
				}
				
				var drawPosInd = 0;
				
				for (var k = 0; k < partitions[i].Content[j].Sequence.length; k++)
				{
					if (translations[0] + drawPosInd * alnBlockWidth >= mainCanvas.width)
					{
						break;
					}
					
					if (maskedAction == "hide" && partitions[i].Mask.substr(k, 1) == 0)
					{
						continue;
					}
					
					if (translations[0] + (drawPosInd + 1) * alnBlockWidth < maxNameLen + 4)
					{
						drawPosInd++;
						continue;
					}
					
					var chr = partitions[i].Content[j].Sequence.substr(k, 1);
					var bgCol = undefined;
					if (partitions[i].Content[j].Type == "Protein")
					{
						bgCol = AAColors[chr.toUpperCase()];
					}
					else if (partitions[i].Content[j].Type == "Nucleotide")
					{
						bgCol = NucColors[chr.toUpperCase()];
					}
					
					var blurred = maskedAction == "blur" && partitions[i].Mask.substr(k, 1) == 0;
				
					if (bgCol != undefined)
					{
						if (!blurred)
						{
							ctx.fillStyle = bgCol;
						}
						else
						{
							ctx.fillStyle = rgba(bgCol, maskedBlurAlpha);
						}
						
						ctx.fillRect(drawPosInd * alnBlockWidth, ind * alnLineHeight + alnVMargin, alnBlockWidth, alnLineHeight - alnVMargin * 2);
					}
					
					if (drawLetters)
					{
						if (!blurred)
						{
							ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
						}
						else
						{
							ctx.fillStyle = "rgba(0, 0, 0, " + (0.75 * maskedBlurAlpha) + ")";
						}
						
						ctx.fillText(chr, drawPosInd * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(chr).width / 2, ind * alnLineHeight + alnLineHeight / 2);
					}
					
					drawPosInd++;
				}
			}
			ctx.translate(partitions[i].MaskedLength(maskedAction) * alnBlockWidth, 0);
			translations[0] += partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
		}
	}
	
	translations = [prevTransl[0], prevTransl[1]];
	ctx.restore();
	
	ctx.translate(0, -alnLineHeight * 2);
	translations[1] -= alnLineHeight * 2;
	
	ctx.clearRect(0, 0, mainCanvas.width, alnLineHeight * 2);
	
	var letterWidth = ctx.measureText("M").width;
	var posDelta = parseInt(Math.pow(10, Math.ceil(Math.log10((alnBlockWidth + letterWidth * Math.floor(1 + Math.log10(totalSeqLen))) / alnBlockWidth))));
	
	ctx.fillStyle = "black";
	
	ctx.save();
	prevTransl = [translations[0], translations[1]];
	
	ctx.translate(mainScroll[0], 0);
	translations[0] += mainScroll[0];
	
	ctx.fillText(1, alnBlockWidth / 2 - ctx.measureText(1).width / 2, alnLineHeight / 2);
	
	for (var i = posDelta - 1; i < totalSeqLen; i+= posDelta)
	{
		if (i * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(i + 1).width / 2 + translations[0] >= mainCanvas.width)
		{
			break;
		}
		
		if (i + posDelta < totalSeqLen || ((totalSeqLen - 1) * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(totalSeqLen).width / 2) - (i * alnBlockWidth + alnBlockWidth / 2 + ctx.measureText(i + 1).width / 2) >= alnBlockWidth)
		{
			ctx.fillText(i + 1, i * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(i + 1).width / 2, alnLineHeight / 2);
		}
	}
	
	ctx.fillText(totalSeqLen, (totalSeqLen - 1) * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(totalSeqLen).width / 2, alnLineHeight / 2);
	
	translations = [prevTransl[0], prevTransl[1]];
	ctx.restore();
	
	ctx.save();
	prevTransl = [translations[0], translations[1]];
	
	ctx.translate(mainScroll[0], 0);
	translations[0] += mainScroll[0];
	
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			if (partitions[i].Mask.length < partitions[i].Length)
			{
				partitions[i].Mask += "1".repeat(partitions[i].Length - partitions[i].Mask.length);
			}
			
			if (translations[0] + (partitions[i].MaskedLength() + 1) * alnBlockWidth < maxNameLen + 4)
			{
				ctx.translate(partitions[i].MaskedLength(maskedAction) * alnBlockWidth, 0);
				translations[0] += partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
				continue;
			}
			
			var drawPosInd = 0;
			
			for (var j = 0; j < partitions[i].Length; j++)
			{
				if (drawPosInd * alnBlockWidth + translations[0] >= mainCanvas.width)
				{
					break;
				}
				
				if (translations[0] + (drawPosInd + 1) * alnBlockWidth < maxNameLen + 4)
				{
					drawPosInd++;
					continue;
				}
				
				var maskChr = partitions[i].Mask.substr(j, 1);
				if (maskChr == 1)
				{
					ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
					ctx.fillRect(drawPosInd * alnBlockWidth, alnLineHeight + alnVMargin, alnBlockWidth, alnLineHeight - alnVMargin * 2);
					
					if (drawLetters)
					{
						ctx.fillStyle = "white";
						ctx.fillText(maskChr, drawPosInd * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(maskChr).width / 2, alnLineHeight + alnLineHeight / 2);
					}
					
					drawPosInd++;
				}
				else if (maskChr == 0 && maskedAction != "hide")
				{
					ctx.fillStyle = "white";
					ctx.fillRect(drawPosInd * alnBlockWidth, alnLineHeight + alnVMargin, alnBlockWidth, alnLineHeight - alnVMargin * 2);
					
					if (drawLetters)
					{
						ctx.fillStyle = "rgb(128, 128, 128)";
						ctx.fillText(maskChr, drawPosInd * alnBlockWidth + alnBlockWidth / 2 - ctx.measureText(maskChr).width / 2, alnLineHeight + alnLineHeight / 2);
					}
					
					drawPosInd++;
				}
			}
			
			ctx.translate(partitions[i].MaskedLength(maskedAction) * alnBlockWidth, 0);
			translations[0] += partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
			if (partitionBoundaries.length > 2)
			{
				if (Math.abs(translations[0] - mainScroll[0] - maxNameLen - 4 - totalSeqLen * alnBlockWidth) > 1)
				{
				
					ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
					ctx.lineWidth = 5;
					ctx.beginPath();
					ctx.moveTo(0, 0);
					ctx.lineTo(0, mainCanvas.height);
					ctx.stroke();
				
				}
				
				var minX = - partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
				var maxX = 0;
				
				if (translations[0] + maxX >= maxNameLen + 4 && translations[0] + minX < mainCanvas.width - 16)
				{
					
					minX = Math.max(minX + translations[0], maxNameLen + 4) - translations[0];
					maxX = Math.min(maxX + translations[0], mainCanvas.width - 16) - translations[0];
					
					var txtX = (minX + maxX) * 0.5;
					
					txtX = Math.max(Math.min(- partNameCtx.measureText(partitions[i].Name).width / 2 - 20, txtX), - partitions[i].MaskedLength(maskedAction) * alnBlockWidth + partNameCtx.measureText(partitions[i].Name).width / 2 + 20);
					
					partNameCtx.save();
					
					partNameCtx.textBaseline = "middle";
					partNameCtx.translate(translations[0] + (halfPixel ? 0.5 : 0), 0);
					
					partNameCtx.lineWidth = 5;
					/*partNameCtx.strokeStyle = "rgba(0, 0, 0, 0.5)";
					partNameCtx.beginPath();
					partNameCtx.moveTo(0, 0);
					partNameCtx.lineTo(0, partNameCanvas.height);
					partNameCtx.stroke();*/
					
					/*partNameCtx.strokeStyle = "rgba(0, 0, 0, 0.75)";
					partNameCtx.fillStyle = "rgb(128, 128, 128)";
					partNameCtx.strokeRect(txtX - partNameCtx.measureText(partitions[i].Name).width / 2 - 5, 2.5, partNameCtx.measureText(partitions[i].Name).width + 10, 15);
					partNameCtx.fillRect(txtX - partNameCtx.measureText(partitions[i].Name).width / 2 - 5, 2.5, partNameCtx.measureText(partitions[i].Name).width + 10, 15);*/
					
					partNameCtx.fillStyle = "black";
					partNameCtx.fillText(partitions[i].Name, txtX - partNameCtx.measureText(partitions[i].Name).width / 2, 10);
					
					partNameCtx.restore();
				}
			}
		}
	}
	
	translations = [prevTransl[0], prevTransl[1]];;
	ctx.restore();
	
	ctx.save();
	prevTransl = [translations[0], translations[1]];
	
	ctx.translate(mainScroll[0], 0);
	translations[0] += mainScroll[0];
	
	ctx.clearRect(-translations[0], mainCanvas.height - translations[1] - 2 * alnLineHeight - 16, mainCanvas.width, 2 * alnLineHeight + 16);
	
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			if (translations[0] + (partitions[i].MaskedLength() + 1) * alnBlockWidth < maxNameLen + 4)
			{
				ctx.translate(partitions[i].MaskedLength(maskedAction) * alnBlockWidth, 0);
				translations[0] += partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
				continue;
			}
			
			var drawPosInd = 0;
			for (var k = 0; k < partitions[i].Length; k++)
			{
				if (translations[0] + drawPosInd * alnBlockWidth >= mainCanvas.width)
				{
					break;
				}
				
				if (translations[0] + (drawPosInd + 1) * alnBlockWidth < maxNameLen + 4)
				{
					drawPosInd++;
					continue;
				}
				
				var maskChr = partitions[i].Mask.substr(k, 1);
				
				if (maskedAction == "hide" && maskChr == "0")
				{
					continue;
				}
				
				var gapCount = 0;
				var letterCounts = [];
				for (var j = 0; j < partitions[i].Content.length; j++)
				{
					var chr = partitions[i].Content[j].Sequence.substr(k, 1);
					if (chr == "-")
					{
						gapCount++;
					}
					else
					{
						var found = false;
						for (var l = 0; l < letterCounts.length; l++)
						{
							if (letterCounts[l][0] == chr)
							{
								letterCounts[l][1]++;
								found = true;
							}
						}
						if (!found)
						{
							letterCounts.push([chr, 1])
						}
					}
				}
				try
				{
					var cons = (letterCounts.sort(function (a, b) { return b[1] - a[1]; })[0][1] - 1) / (partitions[i].Content.length - 1 - gapCount);
					gapCount = gapCount / partitions[i].Content.length;
					
					ctx.fillStyle = "rgb(255, 127, 0)";
					if (maskedAction == "blur" && maskChr == "0")
					{
						ctx.fillStyle = "rgba(255, 127, 0, " + maskedBlurAlpha + ")";
					}
					ctx.fillRect(drawPosInd * alnBlockWidth, mainCanvas.height - translations[1] - alnLineHeight - 16 - alnLineHeight * gapCount, alnBlockWidth, alnLineHeight * gapCount);
					
					ctx.fillStyle = "rgb(34, 177, 76)";
					if (maskedAction == "blur" && maskChr == "0")
					{
						ctx.fillStyle = "rgba(34, 177, 76, " + maskedBlurAlpha + ")";
					}
					ctx.fillRect(drawPosInd * alnBlockWidth, mainCanvas.height - translations[1] - 16 - alnLineHeight * cons, alnBlockWidth, alnLineHeight * cons);
				}
				catch (e) { }
				drawPosInd++;
			}
			ctx.translate(partitions[i].MaskedLength(maskedAction) * alnBlockWidth, 0);
			translations[0] += partitions[i].MaskedLength(maskedAction) * alnBlockWidth;
		}
	}
	
	translations = [prevTransl[0], prevTransl[1]];;
	ctx.restore();
	
	ctx.restore();
	
	ctx.font = labelFontSize + "px Open Sans";
	ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
	ctx.textBaseline = "middle";
	
	ctx.clearRect(0, 0, maxNameLen + 4 + (halfPixel ? 0.5 : 0), mainCanvas.height);
	partNameCtx.clearRect(0, 0, maxNameLen + 4 + (halfPixel ? 0.5 : 0), partNameCanvas.height);
	
	ctx.save();
	prevTransl = [translations[0], translations[1]];
	
	ctx.translate(0, mainScroll[1]);
	translations[1] += mainScroll[1];
	
	for (var i = 0; i < sequenceNames.length; i++)
	{
		if (translations[1] + i * alnLineHeight >= mainCanvas.height - 4 * alnLineHeight - 16 || translations[1] + i * alnLineHeight < -alnLineHeight)
		{
			continue;
		}
		if (selectedSequences.indexOf(sequenceNames[i]) >= 0)
		{
			ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
			ctx.fillRect(0, alnLineHeight * 2 + i * alnLineHeight, /*maxNameLen + 4*/mainCanvas.width - 16, alnLineHeight);
			ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
		}
		ctx.fillText(sequenceNames[i], maxNameLen - ctx.measureText(sequenceNames[i]).width, alnLineHeight * 5 / 2 + i * alnLineHeight);
	}
	
	translations = [prevTransl[0], prevTransl[1]];;
	ctx.restore();

	ctx.clearRect(0, 0, maxNameLen + 4, alnLineHeight * 2);
	ctx.clearRect(0, mainCanvas.height - alnLineHeight * 2 - 16, maxNameLen + 4, alnLineHeight * 2 + 16);
	
	ctx.font = "bold italic " + labelFontSize + "px Open Sans";
	ctx.fillText("Mask", maxNameLen - ctx.measureText("Mask").width, alnLineHeight + alnLineHeight / 2);
	ctx.fillText("Gaps", maxNameLen - ctx.measureText("Gaps").width, mainCanvas.height - alnLineHeight - 16 - alnLineHeight / 2);
	ctx.fillText("Identity", maxNameLen - ctx.measureText("Identity").width, mainCanvas.height - alnLineHeight - 16 + alnLineHeight / 2);
	
	lastDrawnMaxNameLen = maxNameLen;

	drawMainScrollBars();
	
	//var t1 = performance.now();
	//console.log(t1 - t0);
}

function rgba(col, a)
{
	col = col.replace("rgb(", "").replace("rgba(", "").replace(" ", "").replace(")", "").split(",");
	return "rgba(" + col[0] + ", " + col[1] + ", " + col[2] + ", " + a + ")";
}

var alignmentVScrolling = false;
var alignmentVHover = false;

var alignmentHScrolling = false;
var alignmentHHover = false;

function drawMainScrollBars()
{
	ctx.clearRect(0, mainCanvas.height - 16, mainCanvas.width, 16);
	ctx.clearRect(mainCanvas.width - 16, 0, 16, mainCanvas.height);
	
	drawVScrollBar(ctx, mainCanvas.width - 16, alnLineHeight * 2, mainCanvas.height - 16 - alnLineHeight * 4, -mainScroll[1] / alnLineHeight, Math.max(0, Math.ceil((lastDrawnNameCount * alnLineHeight - mainCanvas.height + 16 + 4 * alnLineHeight) / alnLineHeight)), alignmentVHover, alignmentVScrolling);
	
	drawHScrollBar(ctx, lastDrawnMaxNameLen + 4, mainCanvas.height - 16, mainCanvas.width - lastDrawnMaxNameLen - 4 - 16, -mainScroll[0] / alnBlockWidth, Math.max(0, Math.ceil((lastDrawnTotalLength * alnBlockWidth - mainCanvas.width + 16 + lastDrawnMaxNameLen + 4) / alnBlockWidth)), alignmentHHover, alignmentHScrolling);
}

function mainCanvasMouseMove(event)
{
	var rect = mainCanvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
	
	if (x >= mainCanvas.width - 16 && y >= alnLineHeight * 2 && y <= mainCanvas.height - 2 * alnLineHeight - 16)
	{
		var height = mainCanvas.height - alnLineHeight * 4 - 16;
		var max = Math.ceil((lastDrawnNameCount * alnLineHeight - mainCanvas.height + 4 * alnLineHeight + 16) / alnLineHeight);
		var caretHeight = Math.max(16, (height - 32) / (max + 1));
		var caretY = 16 + (height - 32 - caretHeight) * (-mainScroll[1] / alnLineHeight / max);
		
		if (y >= caretY + alnLineHeight * 2 && y <= caretY + alnLineHeight * 2 + caretHeight)
		{
			alignmentVHover = true;
		}
		else
		{
			alignmentVHover = false;
		}
	}
	else
	{
		alignmentVHover = false;
	}
	
	if (y >= mainCanvas.height - 16 && x >= lastDrawnMaxNameLen + 4 && x <= mainCanvas.width - 16)
	{
		var width = mainCanvas.width - lastDrawnMaxNameLen - 4 - 16;
		var max = Math.max(0, Math.ceil((lastDrawnTotalLength * alnBlockWidth - mainCanvas.width + 16 + lastDrawnMaxNameLen + 4) / alnBlockWidth));
		var caretWidth = Math.max(16, (width - 32) / (max + 1));
		var caretX = 16 + (width - 32 - caretWidth) * (-mainScroll[0] / alnBlockWidth / max);
		
		if (x >= caretX + lastDrawnMaxNameLen + 4 && x <= caretX + caretWidth + lastDrawnMaxNameLen + 4)
		{
			alignmentHHover = true;
		}
		else
		{
			alignmentHHover = false;
		}
	}
	else
	{
		alignmentHHover = false;
	}
	
	if (alignmentVScrolling)
	{
		var height = mainCanvas.height - alnLineHeight * 4 - 16;
		var max = Math.ceil((lastDrawnNameCount * alnLineHeight - mainCanvas.height + 4 * alnLineHeight + 16) / alnLineHeight);
		var caretHeight = Math.max(16, (height - 32) / (max + 1));
		
		var delta = ((y - mainCanvasVScrollStartY) / (height - 32 - caretHeight)) * max;
		
		mainScroll[1] = Math.min(0, Math.max(mainCanvasVScrollPrevVal - delta * alnLineHeight, -max * alnLineHeight));
		drawAlignment();
	}
	else if (alignmentHScrolling)
	{
		var width = mainCanvas.width - lastDrawnMaxNameLen - 4 - 16;
		var max = Math.max(0, Math.ceil((lastDrawnTotalLength * alnBlockWidth - mainCanvas.width + 16 + lastDrawnMaxNameLen + 4) / alnBlockWidth));
		var caretWidth = Math.max(16, (width - 32) / (max + 1));
		
		var delta = ((x - mainCanvasHScrollStartX) / (width - 32 - caretWidth)) * max;
		
		mainScroll[0] = Math.min(0, Math.max(mainCanvasHScrollPrevVal - delta * alnBlockWidth, -max * alnBlockWidth));
		drawAlignment();
	}
	
	if (event.buttons == 1)
	{
		if (maskSettingState !== "" && y >= alnLineHeight && y <= alnLineHeight * 2 && x > lastDrawnMaxNameLen + 4 && x < mainCanvas.width - 16)
		{
			var ind = Math.floor(((x - mainScroll[0]) - (lastDrawnMaxNameLen + 4)) / alnBlockWidth);
			if (ind >= 0 && ind < lastDrawnTotalLength)
			{
				var startPos = 0;
				var partInd = 0;
				
				for (var i = 0; i < partitions.length; i++)
				{
					if (partitions[i].Active)
					{
						if (startPos + partitions[i].MaskedLength(maskedAction) <= ind)
						{
							startPos += partitions[i].MaskedLength(maskedAction);
						}
						else
						{
							partInd = i;
							break;
						}
					}
				}
				
				var pInd = ind - startPos;
			
				var realInd = -1;
				
				if (maskedAction != "hide")
				{
					realInd = pInd;
				}
				else
				{
					var umCount = 0;					
					while (umCount <= pInd)
					{
						realInd++;
						if (partitions[partInd].Mask.substr(realInd, 1) == "1")
						{
							umCount++;
						}
					}
				}
				
				partitions[partInd].Mask = partitions[partInd].Mask.set(realInd, maskSettingState);
				
				drawEverything();
			}
		}
		
		if (seqSelStatus != "" && x <= lastDrawnMaxNameLen + 4)
		{
			if (y >= alnLineHeight * 2 && y < mainCanvas.height - alnLineHeight * 2 - 16)
			{
				var ind = Math.floor((y - alnLineHeight * 2 - mainScroll[1]) / alnLineHeight);
				
				var selName = lastDrawnNames[ind];
				if (selectedSequences.indexOf(selName) >= 0 && seqSelStatus == "0")
				{
					selectedSequences.splice(selectedSequences.indexOf(selName), 1);
				}
				else if (selectedSequences.indexOf(selName) < 0 && seqSelStatus == "1")
				{
					selectedSequences.push(selName);
				}
			}
			drawAlignment();
		}
	}
	
	drawMainScrollBars();
}

var mainCanvasVScrollStartY = 0;
var mainCanvasVScrollPrevVal = 0;

var mainCanvasHScrollStartX = 0;
var mainCanvasHScrollPrevVal = 0;

var maskSettingState = "";

var seqSelStatus = "";

function mainCanvasMouseDown(event)
{
	var rect = mainCanvas.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
	
	if (x >= mainCanvas.width - 16 && y >= alnLineHeight * 2 && y <= mainCanvas.height - 2 * alnLineHeight - 16)
	{
		var height = mainCanvas.height - alnLineHeight * 4 - 16;
		var max = Math.ceil((lastDrawnNameCount * alnLineHeight - mainCanvas.height + 4 * alnLineHeight + 16) / alnLineHeight);
		var caretHeight = Math.max(16, (height - 32) / (max + 1));
		var caretY = 16 + (height - 32 - caretHeight) * (-mainScroll[1] / alnLineHeight / max);
		
		if (y >= caretY + alnLineHeight * 2 && y <= caretY + alnLineHeight * 2 + caretHeight)
		{
			alignmentVScrolling = true;
			mainCanvasVScrollStartY = y;
			mainCanvasVScrollPrevVal = mainScroll[1];
			drawMainScrollBars();
		}
	}
	else if (y >= mainCanvas.height - 16 && x >= lastDrawnMaxNameLen + 4 && x <= mainCanvas.width - 16)
	{
		var width = mainCanvas.width - lastDrawnMaxNameLen - 4 - 16;
		var max = Math.max(0, Math.ceil((lastDrawnTotalLength * alnBlockWidth - mainCanvas.width + 16 + lastDrawnMaxNameLen + 4) / alnBlockWidth));
		var caretWidth = Math.max(16, (width - 32) / (max + 1));
		var caretX = 16 + (width - 32 - caretWidth) * (-mainScroll[0] / alnBlockWidth / max);
		
		if (x >= caretX + lastDrawnMaxNameLen + 4 && x <= caretX + caretWidth + lastDrawnMaxNameLen + 4)
		{
			alignmentHScrolling = true;
			mainCanvasHScrollStartX = x;
			mainCanvasHScrollPrevVal = mainScroll[0];
			drawMainScrollBars();
		}
	}
	else if (y >= alnLineHeight && y <= alnLineHeight * 2 && x > lastDrawnMaxNameLen + 4 && x < mainCanvas.width - 16)
	{
		var ind = Math.floor(((x - mainScroll[0]) - (lastDrawnMaxNameLen + 4)) / alnBlockWidth);
		if (ind >= 0 && ind < lastDrawnTotalLength)
		{
			var startPos = 0;
			var partInd = 0;
			
			for (var i = 0; i < partitions.length; i++)
			{
				if (partitions[i].Active)
				{
					if (startPos + partitions[i].MaskedLength(maskedAction) <= ind)
					{
						startPos += partitions[i].MaskedLength(maskedAction);
					}
					else
					{
						partInd = i;
						break;
					}
				}
			}
			
			var pInd = ind - startPos;
			
			var realInd = -1;
			
			if (maskedAction != "hide")
			{
				realInd = pInd;
			}
			else
			{
				var umCount = 0;					
				while (umCount <= pInd)
				{
					realInd++;
					if (partitions[partInd].Mask.substr(realInd, 1) == "1")
					{
						umCount++;
					}
				}
			}
			
			maskSettingState = 1 - parseInt(partitions[partInd].Mask.substr(realInd, 1));
			partitions[partInd].Mask = partitions[partInd].Mask.set(realInd, maskSettingState);
			
			drawEverything();
		}
	}
	else if (x <= lastDrawnMaxNameLen + 4)
	{
		if (y >= alnLineHeight * 2 && y < mainCanvas.height - alnLineHeight * 2 - 16)
		{
			var ind = Math.floor((y - alnLineHeight * 2 - mainScroll[1]) / alnLineHeight);
			if (!event.ctrlKey && !event.shiftKey)
			{
				if (ind >= 0 && ind < lastDrawnNameCount)
				{
					selectedSequences = [ lastDrawnNames[ind] ];
					seqSelStatus = "1";
				}
				else
				{
					selectedSequences = [];
					seqSelStatus = "0";
				}
			}
			else
			{
				var selName = lastDrawnNames[ind];
				if (selectedSequences.indexOf(selName) >= 0)
				{
					selectedSequences.splice(selectedSequences.indexOf(selName), 1);
					seqSelStatus = "0";
				}
				else
				{
					selectedSequences.push(selName);
					seqSelStatus = "1";
				}
			}
		}
		else
		{
			selectedSequences = [];
			seqSelStatus = "0";
		}
		drawAlignment();
	}
}

function mainCanvasMouseUp(event)
{
	alignmentVScrolling = false;
	alignmentHScrolling = false;
	maskSettingState = "";
	seqSelStatus = "";
	drawMainScrollBars();
}

function mainCanvasMouseWheel(event)
{
	var direction = (event.detail < 0 || event.wheelDelta > 0) ? -1 : 1;
	if (!event.ctrlKey)
	{
		var max = Math.ceil((lastDrawnNameCount * alnLineHeight - mainCanvas.height + 4 * alnLineHeight + 16) / alnLineHeight);
		mainScroll[1] = Math.min(0, Math.max(mainScroll[1] - direction * 5 * alnLineHeight, -max * alnLineHeight));
	}
	else
	{
		var max = Math.max(0, Math.ceil((lastDrawnTotalLength * alnBlockWidth - mainCanvas.width + 16 + lastDrawnMaxNameLen + 4) / alnBlockWidth));
		mainScroll[0] = Math.min(0, Math.max(mainScroll[0] - direction * 10 * alnBlockWidth, -max * alnBlockWidth));
	}
	
	event.preventDefault();
	drawAlignment();
}

var partitionBoundaries = [];

function getPartitionBounds()
{
	partitionBoundaries = [];
	var pos = 0;
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			partitionBoundaries.push(pos);
			pos += partitions[i].MaskedLength();
		}
	}
	partitionBoundaries.push(pos);
}

function drawHScrollBar(context, x, y, width, position, max, hover, active)
{
	position = Math.max(0, Math.min(position, max));
	context.save();
	context.translate(x, y);
	context.clearRect(0, 0, width, 16);
	context.fillStyle = "rgba(0, 0, 0, 0.1)";
	context.fillRect(0, 0, width, 16);
	
	context.fillStyle = "rgba(0, 0, 0, 0.5)";
	context.beginPath();
	context.moveTo(6, 8);
	context.lineTo(10, 12);
	context.lineTo(10, 4);
	context.fill();
	
	context.beginPath();
	context.moveTo(width - 6, 8);
	context.lineTo(width - 10, 12);
	context.lineTo(width - 10, 4);
	context.fill();
	
	var caretWidth = Math.max(16, (width - 32) / (max + 1));
	
	context.fillStyle = active ? "rgba(0, 0, 0, 0.5)" : hover ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.2)";
	context.fillRect(16 + (width - 32 - caretWidth) * (position / max), 2, caretWidth, 12);
	
	context.strokeStyle = "rgba(0, 0, 0, 0.5)";
	context.lineWidth = 2;
	for (var i = 1; i < partitionBoundaries.length - 1; i++)
	{
		var x = (partitionBoundaries[i] / partitionBoundaries[partitionBoundaries.length - 1]) * (width - 32) + 16;
		context.beginPath();
		context.moveTo(x, 2);
		context.lineTo(x, 14);
		context.stroke();
	}
	
	context.restore();
}