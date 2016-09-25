angular
.module('angularBoomerangCacheExample', ['boomerang.cache'])
.config(function (boomerangCacheProvider) {
	
	// default storage type is local
	// boomerangCacheProvider.setStorageType('session');

})
.controller('MainCtrl', function ($scope, $http, boomerangCache) {
	
	var starwars = boomerangCache.create('starwars');	

	starwars.clear();

	$scope.loading = false;
	
	$scope.getCharactersFromApi = function () {

		$scope.loading = true;

		$http.get('http://swapi.co/api/people').success(function (response) {

			$scope.apiData = response.results;

			$http.get(response.next).success(function (response) {
				
				$scope.apiData.push(response.results);

				// put data to cache
				starwars.set('characters', $scope.apiData);

				$scope.loading = false;
			});
		});
	}

	$scope.getCharactersFromCache = function () {
		$scope.cacheData = starwars.get('characters');
	}

	$scope.resetApi = function () {
		$scope.apiData = [];
	}

	$scope.resetCache = function () {
		$scope.cacheData = [];
	}

	$scope.clearCache = function () {
		$scope.cacheData = [];
		starwars.clear();
	}

});