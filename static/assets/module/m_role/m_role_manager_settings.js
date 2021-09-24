/**
 * 权限设置－部门负责人、审批人设置
 * Created by wrb on 2018/11/2.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_manager_settings",
        defaults = {
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.renderContent();
        }
        ,renderContent:function () {
            var that = this;
            var $data = {};


            that.getData(function (data) {
                var html = template('m_role/m_role_manager_settings',{dataList:data});
                $(that.element).html(html);

                //去掉第一列
                $(that.element).find('tbody tr').eq(0).remove();
                if(data && data.length>0){
                    var orgId = data[0].id;
                    var classStr = 'treegrid-parent-'+orgId;
                    $(that.element).find('tr.'+classStr).each(function () {
                        $(this).removeClass(classStr);
                        $(this).attr('data-pid','');
                    });
                }



                $(that.element).find('.tree').treegrid(
                    {
                        expanderExpandedClass: 'ic-open',
                        expanderCollapsedClass: 'ic-retract',
                        treeColumn: 0
                    }
                );
                that.editHoverFun();
                that.bindAddUsers();
            });


        }
        //渲染列表
        ,getData:function (callBack) {
            var that = this;

            var options={};
            options.url=restApi.url_listDepartTree;
            m_ajax.get(options,function (response) {

                if(response.code=='0'){
                    that._dataList = response.data;
                    if(callBack)
                        callBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            })

        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('tr');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action="addUsers"]').each(function () {

                var $this = $(this);
                $this.closest('TD').hover(function () {
                    $this.css('visibility','visible');
                },function () {
                    $this.css('visibility','hidden');
                })
            });

        }
        ,bindAddUsers:function () {
            var that = this;

            $(that.element).find('a[data-action="addUsers"]').off('click').on('click',function () {

                var orgId = $(this).closest('tr').attr('data-id'),key = $(this).attr('data-key'),title=$(this).attr('data-title');
                var roleId = $(this).attr('data-role');
                var dataItem = getObjectInArray(that._dataList,orgId);

                $('body').m_role_select_user({
                    orgId:orgId,
                    title:'设置'+title,
                    selectedUserList:dataItem[key],
                    selectUserCallback:function (data, $ele) {
                        var targetUser='<strong style="color:red;margin:0 3px;">'+data.userName+'</strong>';
                        var tips = '确定将'+title+'更换为'+targetUser+'？';
                        if(!(dataItem[key] && dataItem[key].length>0)){
                            tips = '确定将'+title+'设置为'+targetUser+'？';
                        }
                        var userList = [];
                        userList.push(data.companyUserId);
                        S_layer.confirm(tips, function () {

                            var options={};
                            options.url= restApi.url_saveDepartManager;
                            options.postData = {};
                            options.postData.roleId = roleId;
                            options.postData.orgId = orgId;
                            options.postData.companyUserList = userList;
                            m_ajax.postJson(options,function (response) {
                                if(response.code=='0'){
                                    S_layer.close($ele);
                                    S_toastr.success('保存成功！');
                                    that.renderContent();
                                }else {
                                    S_layer.error(response.info);
                                }
                            })

                        }, function () {
                            //S_layer.close($($ele));
                        });
                    }
                },true);
            });
        }

    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
