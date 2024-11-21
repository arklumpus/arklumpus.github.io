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

function uiChange()
{
	if (alnLineHeight != parseFloat(document.getElementById("alnLH").value))
	{
		mainScroll[1] = 0;
	}
	
	if (alnBlockWidth != parseFloat(document.getElementById("alnBW").value))
	{
		mainScroll[0] = 0;
	}
	
	alnLineHeight = parseFloat(document.getElementById("alnLH").value);
	alnBlockWidth = parseFloat(document.getElementById("alnBW").value);
	
	alnVMargin = parseFloat(document.getElementById("alnLM").value);
	alnFontSize = parseFloat(document.getElementById("alnFS").value);
	labelFontSize = parseFloat(document.getElementById("alnLFS").value);
	
	maskedAction = document.getElementById("alnMA").value;
	maskedBlurAlpha = parseFloat(document.getElementById("alnBMA").value);
	
	halfPixel = document.getElementById("hpX").checked;
	halfPixelY = document.getElementById("hpY").checked;
	drawAlignmentLetters = document.getElementById("alnDL").checked;
	sortAlphabetically = document.getElementById("alphSort").checked;
	
	drawEverything();
}

function filterTypeChange()
{
	if(document.getElementById("filterType").value == "alifilter")
	{
		document.getElementById("thresholdValue").value = aliFilterDefaultModel.FastThreshold;
		document.getElementById("thresholdSide").value = "smaller";
		document.getElementById("thresholdType").value = "relative";
		document.getElementById("filterOperation").value = "set";
		document.getElementById("filterValue").value = "0";
	}
	else if (document.getElementById("filterType").value == "alifilter_custom")
	{
		let input = document.createElement("input");
		input.setAttribute("type", "file");

		input.oncancel = function()
		{
			if (document.getElementById("filterType").options[5].value = "alifilter")
			{
				document.getElementById("filterType").value = "alifilter";
				document.getElementById("thresholdValue").value = aliFilterDefaultModel.FastThreshold;
				document.getElementById("thresholdSide").value = "smaller";
				document.getElementById("thresholdType").value = "relative";
				document.getElementById("filterOperation").value = "set";
				document.getElementById("filterValue").value = "0";
			}
			else
			{
				document.getElementById("filterType").value = "gap";
			}
		}
		
		input.onchange = function()
		{
			if (input.files.length > 0)
			{
				var reader = new FileReader();
				reader.onload = function (e)
				{
					let modelJson = e.target.result;

					aliFilterCustomModel = aliFilter.loadModelFromJSON(modelJson);
					document.getElementById("thresholdValue").value = aliFilterCustomModel.FastThreshold;
					document.getElementById("thresholdSide").value = "smaller";
					document.getElementById("thresholdType").value = "relative";
					document.getElementById("filterOperation").value = "set";
					document.getElementById("filterValue").value = "0";
				};
				reader.readAsText(input.files[0]);
			}
			else
			{
				if (document.getElementById("filterType").options[5].value = "alifilter")
				{
					document.getElementById("filterType").value = "alifilter";
					document.getElementById("thresholdValue").value = aliFilterDefaultModel.FastThreshold;
					document.getElementById("thresholdSide").value = "smaller";
					document.getElementById("thresholdType").value = "relative";
					document.getElementById("filterOperation").value = "set";
					document.getElementById("filterValue").value = "0";
				}
				else
				{
					document.getElementById("filterType").value = "gap";
				}
			}
		};
		
		input.click();
	}
}

function applyFilter()
{
	var target = document.getElementById("filterApply").value;
	var targetPartitions = [];
	
	for (var i = 0; i < partitions.length; i++)
	{
		switch (target)
		{
			case "active":
				if (partitions[i].Active)
				{
					targetPartitions.push(partitions[i]);
				}
				break;
			case "selected":
				if (partitions[i].Selected)
				{
					targetPartitions.push(partitions[i]);
				}
				break;
			case "all":
				targetPartitions.push(partitions[i]);
				break;
		}
	}
	
	var checkFunction = function(partition, index) { };
	
	var filterType = document.getElementById("filterType").value;
	var thresholdSide = document.getElementById("thresholdSide").value;
	var thresholdValue = parseFloat(document.getElementById("thresholdValue").value);
	var thresholdType = document.getElementById("thresholdType").value == "absolute";
	
	switch (filterType)
	{
		case "start":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					return index > thresholdValue * (thresholdType ? 1 : partition.Length);
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					return index < thresholdValue * (thresholdType ? 1 : partition.Length);
				};
			}
			break;
		case "end":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					return partition.Length - index - 1 > thresholdValue * (thresholdType ? 1 : partition.Length);
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					return partition.Length - index - 1 < thresholdValue * (thresholdType ? 1 : partition.Length);
				};
			}
			break;
		case "gap":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					var gapCount = 0;
					for (var j = 0; j < partition.Content.length; j++)
					{
						if (partition.Content[j].Sequence.substr(index, 1) == "-")
						{
							gapCount++;
						}
					}
					gapCount = gapCount / (thresholdType ? 1 : partition.Content.length);
						
					return gapCount > thresholdValue;
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					var gapCount = 0;
					for (var j = 0; j < partition.Content.length; j++)
					{
						if (partition.Content[j].Sequence.substr(index, 1) == "-")
						{
							gapCount++;
						}
					}
					gapCount = gapCount / (thresholdType ? 1 : partition.Content.length);
						
					return gapCount < thresholdValue;
				};
			}
			break;
		case "id+G":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					var letterCounts = [];
					for (var j = 0; j < partitions[i].Content.length; j++)
					{
						var chr = partitions[i].Content[j].Sequence.substr(index, 1);
						if (chr != "-")
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
					var cons = (letterCounts.sort(function (a, b) { return b[1] - a[1]; })[0][1] - 1) / (thresholdType ? 1 : partition.Content.length);
						
					return cons > thresholdValue;
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					var letterCounts = [];
					for (var j = 0; j < partitions[i].Content.length; j++)
					{
						var chr = partitions[i].Content[j].Sequence.substr(index, 1);
						if (chr != "-")
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
					var cons = (letterCounts.sort(function (a, b) { return b[1] - a[1]; })[0][1] - 1) / (thresholdType ? 1 : partition.Content.length);
						
					return cons < thresholdValue;
				};
			}
			break;
		case "id-G":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					var letterCounts = [];
					var gapCount = 0;
					for (var j = 0; j < partitions[i].Content.length; j++)
					{
						var chr = partitions[i].Content[j].Sequence.substr(index, 1);
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
					var cons = (letterCounts.sort(function (a, b) { return b[1] - a[1]; })[0][1] - 1) / (thresholdType ? 1 : (partition.Content.length - gapCount));
						
					return cons > thresholdValue;
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					var letterCounts = [];
					var gapCount = 0;
					for (var j = 0; j < partitions[i].Content.length; j++)
					{
						var chr = partitions[i].Content[j].Sequence.substr(index, 1);
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
					var cons = (letterCounts.sort(function (a, b) { return b[1] - a[1]; })[0][1] - 1) / (thresholdType ? 1 : (partition.Content.length - gapCount));
						
					return cons < thresholdValue;
				};
			}
			break;
		case "alifilter":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					if (!partition.AliFilterFeatures)
					{
						let sequences = new Array(partition.Content.length);
						for (let i = 0; i < partition.Content.length; i++)
						{
							sequences[i]  = partition.Content[i].Sequence;
						}
						partition.AliFilterFeatures = aliFilter.getAlignmentFeatures(sequences);
						partition.AliFilterScores = [];
					}

					if (!partition.AliFilterScores[aliFilterDefaultModel.Id])
					{
						partition.AliFilterScores[aliFilterDefaultModel.Id] = aliFilterDefaultModel.getScores(partition.AliFilterFeatures);
					}

					return partition.AliFilterScores[aliFilterDefaultModel.Id][index] > thresholdValue;
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					if (!partition.AliFilterFeatures)
						{
							let sequences = new Array(partition.Content.length);
							for (let i = 0; i < partition.Content.length; i++)
							{
								sequences[i]  = partition.Content[i].Sequence;
							}
							partition.AliFilterFeatures = aliFilter.getAlignmentFeatures(sequences);
							partition.AliFilterScores = [];
						}
	
						if (!partition.AliFilterScores[aliFilterDefaultModel.Id])
						{
							partition.AliFilterScores[aliFilterDefaultModel.Id] = aliFilterDefaultModel.getScores(partition.AliFilterFeatures);
						}
	
						return partition.AliFilterScores[aliFilterDefaultModel.Id][index] < thresholdValue;
				};
			}
			break;
		case "alifilter_custom":
			if (thresholdSide == "greater")
			{
				checkFunction = function(partition, index) {
					if (!partition.AliFilterFeatures)
					{
						let sequences = new Array(partition.Content.length);
						for (let i = 0; i < partition.Content.length; i++)
						{
							sequences[i]  = partition.Content[i].Sequence;
						}
						partition.AliFilterFeatures = aliFilter.getAlignmentFeatures(sequences);
						partition.AliFilterScores = [];
					}

					if (!partition.AliFilterScores[aliFilterCustomModel.Id])
					{
						partition.AliFilterScores[aliFilterCustomModel.Id] = aliFilterCustomModel.getScores(partition.AliFilterFeatures);
					}

					return partition.AliFilterScores[aliFilterCustomModel.Id][index] > thresholdValue;
				};
			}
			else
			{
				checkFunction = function(partition, index) {
					if (!partition.AliFilterFeatures)
						{
							let sequences = new Array(partition.Content.length);
							for (let i = 0; i < partition.Content.length; i++)
							{
								sequences[i]  = partition.Content[i].Sequence;
							}
							partition.AliFilterFeatures = aliFilter.getAlignmentFeatures(sequences);
							partition.AliFilterScores = [];
						}
	
						if (!partition.AliFilterScores[aliFilterCustomModel.Id])
						{
							partition.AliFilterScores[aliFilterCustomModel.Id] = aliFilterCustomModel.getScores(partition.AliFilterFeatures);
						}
	
						return partition.AliFilterScores[aliFilterCustomModel.Id][index] < thresholdValue;
				};
			}
			break;
	}
	
	var applyFunction = function(a, b) { };	//a old, b new
	
	var filterOp = document.getElementById("filterOperation").value;
	var filterOpValue = parseInt(document.getElementById("filterValue").value);
	
	switch (filterOp)
	{
		case "set":
			applyFunction = function (a, b) { return b; };
			break;
		case "and":
			applyFunction = function (a, b) { return a && b; };
			break;
		case "or":
			applyFunction = function(a, b) { return a || b; };
			break;
		case "andNot":
			applyFunction = function(a, b) { return (1 - a) && b; };
			break;
		case "orNot":
			applyFunction = function(a, b) { return (1 - a) || b; };
			break;
		case "nand":
			applyFunction = function (a, b) { return 1 - (a && b); };
			break;
		case "xor":
			applyFunction = function (a, b) { return a ^ b; };
			break;
	}
	
	for (var i = 0; i < targetPartitions.length; i++)
	{
		var currMask = targetPartitions[i].Mask.split("");
		for (var j = 0; j < targetPartitions[i].Length; j++)
		{
			var filterOutput = checkFunction(targetPartitions[i], j) ? filterOpValue : (1 - filterOpValue);
			currMask[j] = applyFunction(parseInt(currMask[j]), filterOutput);
		}
		targetPartitions[i].Mask = currMask.join("");
	}
	
	drawEverything();
}


function deleteSeq()
{
	if (selectedSequences.length > 0)
	{
		for (var i = 0; i < partitions.length; i++)
		{
			for (var j = partitions[i].Content.length - 1; j >= 0; j--)
			{
				if (selectedSequences.indexOf(partitions[i].Content[j].Name) >= 0)
				{
					partitions[i].Content.splice(j, 1);
				}
			}
		}
		selectedSequences = [];
		drawEverything();
	}
}

function cancelSave()
{
	document.getElementById("saveDiv").style.display = "none";
}

function openSave()
{
	document.getElementById("saveDiv").style.display = "block";
}

function save()
{
	var files = [];
	var fileNames = [];
	var onlyMasked = document.getElementById("onlyMasked").checked;
	var singleFile = document.getElementById("fileType").value == "single";
	var onlyActive = document.getElementById("onlyActive").checked;
	var fileFormat = document.getElementById("fileFormat").value;
	var outFileName = document.getElementById("outFileName").value;
	var replaceSpaces = document.getElementById("replaceSpaces").checked;
	
	
	if (fileFormat == "json")
	{
		if (singleFile)
		{
			if (!onlyActive)
			{
				files = [ JSON.stringify(partitions) ];
			}
			else
			{
				var workingParts = [];
				
				for (var i = 0; i < partitions.length; i++)
				{
					if (partitions[i].Active)
					{
						workingParts.push(partitions[i]);
					}
				}
				
				files = [ JSON.stringify(workingParts) ];
			}
		}
		else
		{
			for (var i = 0; i < partitions.length; i++)
			{
				if (!onlyActive || partitions[i].Active)
				{
					files.push(JSON.stringify([ partitions[i] ]));
					fileNames.push(partitions[i].Name);
				}
			}
		}
	}
	else
	{
		var sequences = [];
		for (var i = 0; i < partitions.length; i++)
		{
			var currSeqs = { };
			
			for (var j = 0; j < partitions[i].Content.length; j++)
			{
				var currSeq = "";
				for (var k = 0; k < partitions[i].Length; k++)
				{
					if (!onlyMasked || partitions[i].Mask.substr(k, 1) == "1")
					{
						currSeq += partitions[i].Content[j].Sequence.substr(k, 1);
					}
				}
				currSeqs[partitions[i].Content[j].Name] = currSeq;
			}
			
			sequences.push(currSeqs);
		}
		
		var fileSeqs = [];
		var fileSeqNames = [];
		
		if (!singleFile)
		{
			for (var i = 0; i < partitions.length; i++)
			{
				if (!onlyActive || partitions[i].Active)
				{
					fileSeqs.push(sequences[i]);
					fileSeqNames.push(partitions[i].Name);
				}
			}
		}
		else
		{
			var workingSeqs = { };
			var seqNames = [];
			for (var i = 0; i < partitions.length; i++)
			{
				if (!onlyActive || partitions[i].Active)
				{
					for (var j = 0; j < partitions[i].Content.length; j++)
					{
						if (seqNames.indexOf(partitions[i].Content[j].Name) < 0)
						{
							seqNames.push(partitions[i].Content[j].Name);
						}
					}
				}
			}
			if (sortAlphabetically)
			{
				seqNames.sort();
			}
			for (var l = 0; l < seqNames.length; l++)
			{
				workingSeqs[seqNames[l]] = "";
			}
			
			for (var i = 0; i < partitions.length; i++)
			{
				if (!onlyActive || partitions[i].Active)
				{
					for (var l = 0; l < seqNames.length; l++)
					{
						var found = false;
						for (var j = 0; j < partitions[i].Content.length; j++)
						{
							if (partitions[i].Content[j].Name == seqNames[l])
							{
								workingSeqs[seqNames[l]] += sequences[i][seqNames[l]];
								found = true;
								break;
							}
						}
						if (!found)
						{
							workingSeqs[seqNames[l]] += "-".repeat(partitions[i].MaskedLength(onlyMasked ? "hide" : "show"));
						}
					}
				}
			}
			fileSeqs.push(workingSeqs);
		}
		
		for (var i = 0; i < fileSeqs.length; i++)
		{
			var txt = "";
			
			if (fileFormat == "fasta")
			{
				for (var j in fileSeqs[i])
				{
					if (!replaceSpaces)
					{
						txt += ">" + j + "\n" + fileSeqs[i][j] + "\n";
					}
					else
					{
						var sn = j;
						while (sn.indexOf(" ") >= 0)
						{
							sn = sn.replace(" ", "_");
						}
						txt += ">" + sn + "\n" + fileSeqs[i][j] + "\n";
					}
				}
			}
			else if (fileFormat == "phylip")
			{
				var seqCount = 0;
				var maxSeqNameLen = 0;
				var seqLen = 0;
				for (var j in fileSeqs[i])
				{
					seqCount++;
					maxSeqNameLen = Math.max(j.length, maxSeqNameLen);
					seqLen = fileSeqs[i][j].length;
				}
				maxSeqNameLen++;
				txt = seqCount + " " + seqLen + "\n";
				for (var j in fileSeqs[i])
				{
					if (!replaceSpaces)
					{
						txt += j + " ".repeat(maxSeqNameLen - j.length) + fileSeqs[i][j] + "\n";
					}
					else
					{
						var sn = j;
						while (sn.indexOf(" ") >= 0)
						{
							sn = sn.replace(" ", "_");
						}
						
						txt += sn + " ".repeat(maxSeqNameLen - j.length) + fileSeqs[i][j] + "\n";
					}
				}
				txt = txt.substr(0, txt.length - 1);
			}
			
			files.push(txt);
			if (fileSeqs.length > 1)
			{
				fileNames.push(fileSeqNames[i]);
			}
		}
	}
	
	if (files.length == 1)
	{
		let blob = new Blob([files[0]], {type: "octet/stream"});
		let url = window.URL.createObjectURL(blob);
		
		var ln = document.createElement("a");
		ln.href = url;
		ln.download = outFileName + "." + getExtension(fileFormat);
		ln.click();
		window.URL.revokeObjectURL(url);
		
		/*var ln = document.createElement("a");
		ln.href = "data:text/plain," + encodeURIComponent(files[0]);
		ln.download = outFileName + "." + getExtension(fileFormat);
		ln.click();*/
	}
	else
	{
		var zip = new JSZip();
		for (var i = 0; i < files.length; i++)
		{
			zip.file(fileNames[i] + "." + getExtension(fileFormat), files[i]);
		}
		zip.generateAsync({type: "blob"}).then(function(content) { 
			var ln = document.createElement("a");
			ln.href = URL.createObjectURL(content);
			ln.download = outFileName + ".zip";
			ln.click();
		});
		
	}
}

function getExtension(format)
{
	switch(format)
	{
		case "json":
			return "json";
			break;
		default:
			return format.substr(0, 3);
			break;
	}
}

function selectIncomplete()
{
	selectedSequences = [];
	
	var sequenceNames = [];	
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			for (var j = 0; j < partitions[i].Content.length; j++)
			{
				if (sequenceNames.indexOf(partitions[i].Content[j].Name) < 0)
				{
					sequenceNames.push(partitions[i].Content[j].Name);
				}
			}
		}
	}
	
	for (var i = 0; i < partitions.length; i++)
	{
		if (partitions[i].Active)
		{
			for (var k = 0; k < sequenceNames.length; k++)
			{
				if (selectedSequences.indexOf(sequenceNames[k] < 0))
				{
					var found = false;
					for (var j = 0; j < partitions[i].Content.length; j++)
					{
						if (partitions[i].Content[j].Name == sequenceNames[k])
						{
							found = true;
							break;
						}
					}
					if (!found)
					{
						selectedSequences.push(sequenceNames[k]);
					}
				}
			}
		}
	}
	
	drawAlignment();
}