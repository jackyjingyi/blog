/**
 * Created by wrb on 2016/12/6.
 */

var home_shareRegister={

    init:function(){
        var that=this;

        var currentUrl = window.location.href;
        var urlArr = currentUrl.split('/');
        var companyId = urlArr[urlArr.length-2];
        var userId = urlArr[urlArr.length-1];
        $('#shareStep1').m_share_register({companyId:companyId,userId:userId},true);



    }

};