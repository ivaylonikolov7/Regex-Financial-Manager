var FactoryORM = require('../Classes/FactoryORM');

var Role = (function () {

    var syncRoles = function () {
        return FactoryORM.getORM("Role").sync();
    };
    return {syncRoles: syncRoles}
})();


module.exports = Role;
