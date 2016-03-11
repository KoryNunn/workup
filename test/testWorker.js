console.log('foo');

self.localStorage.set('x', 'y', function(){
    self.localStorage.get('x', function(value){
        console.log(value);
    });
});