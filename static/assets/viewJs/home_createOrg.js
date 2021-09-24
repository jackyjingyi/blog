/**
 * Created by wrb on 2016/12/15.
 */

var home_createOrg={
    init:function(){
        var that=this;
        that.initCreateOrgData();

    }
    ,initCreateOrgData:function () {

        var option = {};
        option.url = restApi.url_ifFirstCreateOrg;
        m_ajax.get(option, function (response) {
            if (response.code == '0') {

                $('#createOrgBox').m_createOrg({
                    saveOrgCallback:function(data){
                        var url = '/iWork/home/workbench';
                        window.location.href = window.rootPath + url;
                    },
                    showPre:(response.data.isFirst?response.data.showPre:null)
                });

            } else {
                S_layer.error(response.info);
            }
        });


    }
};
