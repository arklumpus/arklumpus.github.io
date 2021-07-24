String.prototype.replaceAll = function(needle, replacement)
{
	var tbr = this;
	
	while (tbr.indexOf(needle) >= 0)
	{
		tbr = tbr.replace(needle, replacement);
	}
	
	return tbr;
}

String.prototype.contains = function(needle)
{
	return this.indexOf(needle) >= 0;
}

String.prototype.startsWith = function(needle)
{
	return this.indexOf(needle) == 0;
}

String.prototype.splitLines = function()
{
	var tbr = this.replaceAll("\r", "\n").replaceAll("\n\n", "\n").split("\n");
	
	while (tbr[tbr.length - 1].length == 0)
	{
		tbr.splice(tbr.length - 1, 1);
	}
	
	return tbr;
}

String.prototype.set = function(position, chr)
{
	return this.substr(0, position) + chr + this.substr(position + 1);
}

function readPhy(fileContent)
{
	var lines = fileContent.splitLines();
	
	var rx = /^ *([^ ]*) *([^ ]*)$/;
	
	var mch = lines[0].match(rx);
	
	var seqNum = parseInt(mch[1]);
	var seqLen = parseInt(mch[2]); 
	
	var seqNames = [];
	var sequences = [];
	
	for (var i = 1; i < lines.length; i++)
	{
		var splitLine = lines[i].match(rx);
		seqNames[i - 1] = splitLine[1];
		sequences[i - 1] = splitLine[2];
		if (splitLine[2].length != seqLen)
		{
			console.warn("Sequence " + splitLine[1] + " has the wrong length (" + splitLine[2].length + " instead of " + seqLen + ")");
		}
	}
	
	if (seqNames.length != seqNum)
	{
		console.warn("Wrong number of sequences (" + seqNames.length + " instead of " + seqNum + ")");
	}
	
	return setNamesAndType(sequences, seqNames);
}

function setNamesAndType(sequences, names)
{
	var tbr = [];
	
	for (var i = 0; i < sequences.length; i++)
	{
		var rep = sequences[i].toUpperCase().replaceAll("A", "").replaceAll("C", "").replaceAll("G", "").replaceAll("T", "").replaceAll("U", "").replaceAll("-", "").replaceAll("?", "").replaceAll("N", "").replaceAll("R", "").replaceAll("Y", "");
		var type = rep.length == 0 ? "Nucleotide" : "Protein";
		tbr.push({ Name: names[i], Sequence: sequences[i], Type: type });
	}
	
	return tbr;
}

function readFasta(fileContent)
{
	var lines = fileContent.splitLines();
	
	var seqNames = [];
	var sequences = [];
	
	var currSeq = undefined;
	
	for (var i = 0; i < lines.length; i++)
	{
		if (lines[i].substr(0, 1) == ">")
		{
			if (currSeq != undefined)
			{
				sequences.push(currSeq);
			}
			currSeq = "";
			seqNames.push(lines[i].substr(1));
		}
		else
		{
			currSeq = currSeq + lines[i];
		}
	}
	if (currSeq != undefined)
	{
		sequences.push(currSeq)
	}
	
	return setNamesAndType(sequences, seqNames);
}

function readJson(fileContent)
{
	return { IsJson: true, Content: JSON.parse(fileContent) };
}

function readSequences(fileContent)
{
	if (fileContent.startsWith(">"))
	{
		return readFasta(fileContent);
	}
	if (fileContent.startsWith("["))
	{
		return readJson(fileContent);
	}
	else
	{
		return readPhy(fileContent);
	}
}
