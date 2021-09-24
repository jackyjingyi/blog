/**
 * Created by Wuwq on 2017/3/4.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectMember",
        defaults = {
            projectId: null,
            projectName:null,
            dataCompanyId:null//视图组织ID
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'工作效能'
            }
        ];
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            //that._bindPage();
            that._renderHtml();
        },
        _renderHtml: function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listPersonalOutputValue;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var parts = response.data;
                    if(parts && parts.length>0){
                        $.each(parts,function (i,item) {
                            item.personList.push({'userName':'合计','personalRatio':item.personalRatioTotal,'taskList':[{'personalRatio':item.personalRatioTotal}]});
                        });
                    }
                    var html = template('m_projectMember/m_projectMember', {
                        parts: parts
                    });
                    $(that.element).html(html);
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
                    that._bindBtn();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        , _bindBtn: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click', function (e) {
                var $btn = $(this);
                var action = $btn.attr('data-action');
                var companyId = $btn.attr('data-companyId');//当前要获取的项目立项组织的index
                switch (action) {
                    case 'changeOperatorPerson'://移交商务秘书

                        var options = {};

                        options.isASingleSelectUser = true;
                        options.delSelectedUserCallback = function () {

                        };
                        var operatorPersonId = $(this).attr('data-id'),userName=$(this).attr('data-user-name');
                        options.title = '选择商务秘书';
                        options.selectedUserList = [{
                            id:operatorPersonId,
                            userName:userName
                        }];
                        options.selectUserCallback = function (data, event) {
                            data.type = 1;
                            var targetUser='<strong style="color:red;margin:0 3px;">'+data.userName+'</strong>';
                            S_layer.confirm('确定将商务秘书更换为'+targetUser+'？',function(){
                                that._postManagerChange(data,companyId,event);
                            },function(){
                                //S_layer.close($(event));
                            });
                        };
                        $('body').m_orgByTree(options);
                        break;

                    case 'changeManagerPerson'://移交项目负责人

                        var options = {};

                        options.isASingleSelectUser = true;
                        options.delSelectedUserCallback = function () {

                        };
                        var designPersonId = $(this).attr('data-id'),userName=$(this).attr('data-user-name');
                        options.title = '选择项目负责人';
                        options.selectedUserList = [{
                            id:designPersonId,
                            userName:userName
                        }];
                        options.selectUserCallback = function (data, event) {
                            data.type = 2;
                            var targetUser='<strong style="color:red;margin:0 3px;">'+data.userName+'</strong>';
                            S_layer.confirm('确定将项目负责人更换为'+targetUser+'？', function () {
                                that._postManagerChange(data, companyId, event);
                            }, function () {
                                //S_layer.close($(event));
                            });
                        };
                        $('body').m_orgByTree(options);
                        break;

                    case 'addProjectMember'://添加项目人员

                        $('body').m_projectMember_add({
                            selectedUserList:[]
                        });
                        break;
                }
                stopPropagation(e);
                return false;

            });
        }
        //移交商务秘书或项目负责人的请求
        , _postManagerChange: function (data, companyId, event) {
            var that = this;
            var option = {};
            option.url = restApi.url_updateProjectManager;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData.companyId = companyId;
            option.postData.type = data.type;
            option.postData.companyUserId = data.companyUserId;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_layer.close($(event));
                    that._renderHtml();
                    if(data.type==1){//移交商务秘书会影响项目权限的编辑更改，需要刷新数据
                        that._refreshMenu();
                    }
                    S_toastr.success('保存成功！');
                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //刷新当前菜单
        , _refreshMenu: function () {
            var that=this,option = {};
            option.projectId = that.settings.projectId;
            option.projectName = that.settings.projectName;
            //option.type = 'projectMember';
            $('#content-right').m_projectMenu(option);
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            new Plugin(this, options);
        });
    };

})(jQuery, window, document);
