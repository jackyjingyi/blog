/**
 * Created by wrb on 2016/12/7.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_teamInfoShow",
        defaults = {
            teamInfo:null,
            serverTypeList:null,
            isEdit:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._roleCode = null;//当前用户的权限集
        this._teamInfo = null;
        this._busInformation = null;//选择的工商信息

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._roleCode = window.currentRoleCodes;
            that.initMainContent();
        }
        //加载主要页面
        ,initMainContent:function(){
            var that = this;
            var $data = {};
            $data.teamInfo = that.settings.teamInfo;
            that._teamInfo = that.settings.teamInfo;
            that._serverTypeIndex = that.settings.teamInfo.serverType;
            $data.serverTypeList = that.settings.serverTypeList;
            var html = template('m_teamInfo/m_teamInfoShow',$data);
            $(that.element).html(html);

            //判断当前用户有没有权限操作
            if(that.settings.isEdit){
                that.bindEditable();
            }else{
                $(that.element).find('a[data-action]').removeClass('editable-click').addClass('not-role');
            }
            that.bindActionClick();

        }
        //在位编辑内容初始化
        ,bindEditable:function(){
            var that = this;
            $(that.element).find('a.editable-click[data-action]').each(function () {
                var $this = $(this);
                var $viewPartyACompany = $(that.element).find('#viewPartyACompany');
                var popoverStyle = {'position': 'relative','top': '-7px','left': '0px','max-width':'750px','width':'95%'};
                var key = $this.attr('data-key');
                var value = $.trim($this.text());

                var dataInfo = null;

                if(key=='serverType' && that.settings.serverTypeList!=null && that.settings.serverTypeList.length>0){//服务类型
                    dataInfo = [];

                    $.each(that.settings.serverTypeList,function (i,item) {
                        var isSelected = false;
                        if(!isNullOrBlank(that._teamInfo.serverType))
                            isSelected = that._teamInfo.serverType.indexOf(item.name)>-1?true:false;

                        dataInfo.push({
                            id:item.id,
                            name:item.name,
                            isSelected:isSelected
                        });
                    });
                    if(!isNullOrBlank(that._teamInfo.serverType))
                        value = that._teamInfo.serverType.split(',');

                    popoverStyle = {'position': 'relative','top': '-5px','left': '0px','max-width':'750px','width':'95%'};
                }
                else if(key=='address'){//地址
                    dataInfo = {};
                    dataInfo.province = that._teamInfo.province;
                    dataInfo.city = that._teamInfo.city;
                    dataInfo.county = that._teamInfo.county;
                    dataInfo.address = that._teamInfo.companyAddress;
                    value = dataInfo;
                }
                else if(key=='companyName'){//组织名称
                    dataInfo = {};
                    dataInfo.enterpriseId = that._teamInfo.enterpriseId==null?'':that._teamInfo.enterpriseId;
                }

                $this.m_editable({
                    inline:true,
                    controlClass : '',
                    popoverStyle : popoverStyle,
                    hideElement:true,
                    value:value,
                    dataInfo:dataInfo,
                    targetNotQuickCloseArr:['viewPartyACompany'],
                    /*m_partyA_selectCallBack:function (data) {
                        that._busInformation = data;
                        $viewPartyACompany.removeClass('hide');
                    },
                    m_partyA_inputChangeCallBack:function (txt) {
                        //判断信息图标是否展示
                        if(that._busInformation && that._busInformation.corpname==txt){
                            $viewPartyACompany.removeClass('hide');
                        }else{
                            $viewPartyACompany.addClass('hide');
                        }
                        if($('.m-floating-popover .viewPartyACompany-box').length>0)
                            $('.m-floating-popover .viewPartyACompany-box').parents('.m-floating-popover').remove();
                    },*/
                    closed:function (data) {

                        if(data==false)
                            return false;

                        if(key=='serverType'){
                            if(data.serverType!=null && typeof (data.serverType) == 'object'){
                                data.serverType = data.serverType.join(',');
                            }else{
                                data.serverType = isNullOrBlank(data.serverType)?'':data.serverType;
                            }
                        }
                        else if(key=='address'){
                            data.companyAddress = data.address;
                            data.address = undefined;
                            data.city = data.city==undefined?'':data.city;
                            data.county = data.county==undefined?'':data.county;
                        }
                        that.saveTeamInfo(data,key);
                    }
                },true);
            });

        }
        //保存组织信息时调用的方法
        ,saveTeamInfo:function(value,name,callback){
            var that = this;
            var options = {};
            options.url = restApi.url_saveOrUpdateCompany;
            options.classId = '#content-right';
            options.postData = that._teamInfo;
            if(typeof value == "object" && !(value.length)){
                $.each(value,function(key,item){
                    options.postData[key] = item;
                });
            }else{
                options.postData[name] = value;
            }
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){

                    S_toastr.success('保存成功！');
                    if(name=='companyName'){
                        $('#navbar a.orgInfo').html(value.companyName+'<span class="caret"></span>')
                    }

                    that.settings.teamInfo = response.data;
                    that.initMainContent();

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //按钮事件绑定
        ,bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click', function (event) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch(dataAction){
                    case 'viewPartyACompany'://查看组织工商信息

                        if($('.m-floating-popover .m-company-box').length>0)
                            $('.m-floating-popover .m-company-box').parents('.m-floating-popover').remove();

                        $this.m_partyA_info({
                            busInformation:that._busInformation,
                            companyName:that._busInformation==null?that.settings.teamInfo.companyName:that._busInformation.corpname
                        },true);

                        break;
                    case 'serverTypeList':

                        $this.m_org_service_type_edit({
                            isPopover:true,
                            serverTypeList:that.settings.serverTypeList,
                            serverType:that._teamInfo.serverType,
                            saveCallback:function ($popover,data) {
                                that.saveTeamInfo(data,'serverType');
                            }
                        });
                        break;
                }

            });
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" +
                    pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
