/**
 * 组织－组织信息
 * Created by wrb on 2016/12/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_orgInfomation",
        defaults = {
            type:null//判断是通过组织架构进来还是通讯录进来，1为组织架构，0为通讯录
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._teamInfo = null;
        this._serverTypeList = null;
        this._fastdfsUrl = window.fastdfsUrl;
        this._name = pluginName;
        this._isEdit = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._isEdit = (window.currentRoleCodes.indexOf('10000301')>-1)&&that.settings.type==1?true:false;
            that.getTeamInfo(function(){
                that.initUserData();
            });
        }
        //加载页面模板
        ,initUserData:function () {

            var that = this;
            var html = template('m_org/m_orgInfomation',{type:that.settings.type});
            $(that.element).html(html);
            rolesControl();
            that.dissolutionCompany();


            $("#infoMainOBox").m_teamInfoShow({
                teamInfo:that._teamInfo,
                isEdit:that._isEdit,
                serverTypeList:that._serverTypeList,
                saveCallBack:function () {
                }
            });

        /*    var filePath = that._teamInfo.filePath;
            if(!isNullOrBlank(filePath)){
                filePath = that._fastdfsUrl + filePath;
            }else{
                filePath = window.serverPath+"/img/default/org_default_headPic.png";
            }
            $(that.element).find('#teamPicShow').m_teamPicUpload({
                filePath:filePath,
                isEdit:that._isEdit,
                fastUrl:that._fastdfsUrl
            });

            if(window.adminFlag==1)
                $(that.element).find('#dissolutionCompany').removeClass('hide');*/

        }
        //解散组织
        ,dissolutionCompany:function(){
            var that = this;
            $(that.element).find('#dissolutionCompany').on('click',function(event){

                var option = {};
                option.classId = "body";
                option.url = restApi.url_validateDisbandCompany;
                m_ajax.post(option,function (response) {
                    if (response.code == '0') {

                        var options = {};
                        var $data = {
                            cellphone : response.data.cellphone,
                            userName : response.data.userName
                        };
                        $.extend($data,that._teamInfo);
                        options.teamInfo = $data;
                        $('#wrapper').m_teamDissolution(options);

                    } else {
                        S_layer.error(response.info);
                    }
                })
            });
        }
        //获取组织信息
        ,getTeamInfo:function(callback){
            var that = this;
            var option = {};
            var id = window.currentCompanyId;//当前组织ID
            option.url = restApi.url_teamInfo+'/'+id;
            m_ajax.get(option,function (response) {
                if (response.code == '0') {
                    that._teamInfo = response.data.companyInfo;
                    //that._fastdfsUrl = response.data.fastdfsUrl;
                    that._serverTypeList = response.data.serverTypeList;
                    if(callback){
                        return callback();
                    }

                } else {
                    S_layer.error(response.info);
                }
            })
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
