
var Quarter = function(year, quarter){

	this.year = year;
	this.quarter = quarter;
	this.str = function(){
		return this.year+"_"+this.quarter;
	}
	
	this.increase = function(){
		this.quarter += 1;
		if(this.quarter > 3){
			this.quarter = 0
			this.year++
		}
		return this;
	}

	this.decrease = function(add){
		this.quarter -= 1;
		if(this.quarter < 0){
			this.quarter = 3
			this.year--
		}
		return this;
	}

	this.add = function(num){
		this.quarter += num % 4;
		this.year += Math.floor(num / 4);
		if(this.quarter > 3){
			this.quarter = this.quarter - 4
			this.year++;
		}
		return this;
	}

	this.sub = function(num){
		this.quarter -= num % 4;
		this.year -= Math.floor(num / 4);
		if(this.quarter < 0){
			this.quarter = this.quarter + 4
			this.year--;
		}
		return this;
	}

	/**
	 * Get previous quarters, including current, one based.
	 * @param numOfQuarters : quarter to start counting back from
	 * @return Array : [{'quarter':'1','year:'2012'}, ...]
	 */
	this.getLastQuarters = function (numOfQuarters){

		var res = [];
		var q = this.quarter;
		for (var i = 0; i < numOfQuarters; i++) {


			res.push();

			if (q == 1){
				year--;
				q = 4;
			}
			else{
				q--;
			}

		};
		return res;
	}

}

module.exports = Quarter;
